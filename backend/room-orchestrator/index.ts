import { config } from "dotenv";
import { RedisClient } from "redis";
import { promisify } from "util";
import { sign } from "jsonwebtoken";
import { CoreV1Api, KubeConfig } from "@kubernetes/client-node";
import { interval } from "rxjs";

config();

const MAX_ROOMS = parseInt((process.env.MAX_ROOMS as string) || "100");

const kubeConfig = new KubeConfig();

kubeConfig.loadFromDefault();

const k8sAPI = kubeConfig.makeApiClient(CoreV1Api);

const redisClient = new RedisClient({
  host: process.env.REDIS_BACKEND as string,
  port: parseInt(process.env.REDIS_PORT as string),
});

const poller = interval(1000).subscribe(async () => {
  const poll = await promisify(redisClient.lindex).bind(redisClient)(
    "roomQueue",
    0
  );

  if (poll) {
    const { body } = await k8sAPI.listNamespacedPod("rooms");

    if (body.items.length <= MAX_ROOMS) {
      const roomToCreate = await promisify(redisClient.lpop).bind(redisClient)(
        "roomQueue"
      );

      const streamer_jwt = sign(
        { roomID: roomToCreate },
        process.env.STREAMER_JWT_SECRET as string,
        { expiresIn: "2h" }
      );

      await k8sAPI.createNamespacedPod("rooms", {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: {
          name: roomToCreate,
        },
        spec: {
          containers: [
            {
              name: roomToCreate,
              image: "stearnsbq/screenhive:room",
              resources: { limits: { memory: "1024Mi", cpu: "1000m" } },
              ports: [{ containerPort: 8080 }],
              env: [
                { name: "STREAMER_TOKEN", value: streamer_jwt },
                { name: "WS_SERVER", value: "ws://websocket" },
                {
                  name: "ROOM_TO_JOIN",
                  value: roomToCreate,
                },
              ],
            },
          ],
        },
      });

      await k8sAPI.createNamespacedService("rooms", {
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name: roomToCreate,
        },
        spec: {
          type: "ClusterIP",
          selector: {
            app: roomToCreate,
          },
        },
      });
    }
  }
});

function signalHandler(signal: any) {
  console.log(`*^!@4=> Received signal to terminate: ${signal}`);

  redisClient.quit();
  poller.unsubscribe();
}

process.on("SIGINT", signalHandler);
process.on("SIGTERM", signalHandler);

// while (true){}
