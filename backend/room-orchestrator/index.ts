import * as k8s from "@kubernetes/client-node";
import { config } from "dotenv";
import { RedisClient } from "redis";
import { promisify } from "util";
import * as jwt from "jsonwebtoken";
config();

const kubeConfig = new k8s.KubeConfig();

kubeConfig.loadFromDefault();

const k8sAPI = kubeConfig.makeApiClient(k8s.CoreV1Api);

const redisClient = new RedisClient({
  host: process.env.REDIS_BACKEND as string,
  port: parseInt(process.env.REDIS_PORT as string),
});

function signalHandler(signal: any) {
  console.log(`*^!@4=> Received signal to terminate: ${signal}`);

  redisClient.quit();
}

process.on("SIGINT", signalHandler);
process.on("SIGTERM", signalHandler);

setInterval(async () => {
  const poll = await promisify(redisClient.lindex).bind(redisClient)(
    "roomQueue",
    0
  );

  if (poll) {
    const { body } = await k8sAPI.listNamespacedPod("rooms");

    if (body.items.length <= parseInt(process.env.MAX_ROOMS as string)) {
      const roomToCreate = await promisify(redisClient.lpop).bind(redisClient)(
        "roomQueue"
      );

      const streamer_jwt = jwt.sign(
        { roomID: roomToCreate },
        process.env.STREAMER_JWT_SECRET as string,
        { expiresIn: "5h" }
      );

      // create the pod

      k8sAPI.createNamespacedPod("rooms", {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: {
          name: "room",
        },
        spec: {
          containers: [
            {
              name: "room",
              image: "stearnsbq/screenhive:room",
              resources: { limits: { memory: "2048Mi", cpu: "500m" } },
              ports: [{ containerPort: 8080 }],
              env: [
                { name: "STREAMER_TOKEN", value: streamer_jwt },
                { name: "WS_SERVER", value: "ws://websocket" },
                {
                  name: "STREAMER_JWT_SECRET",
                  value: process.env.STREAMER_JWT_SECRET as string,
                },
              ],
            },
          ],
        },
      });
    }
  }
}, 1000);

// while (true){}
