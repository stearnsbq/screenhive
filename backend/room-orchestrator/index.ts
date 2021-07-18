import * as k8s from '@kubernetes/client-node';
import { config } from 'dotenv';
import { RedisClient } from 'redis';
import { promisify } from 'util';

config();

const kubeConfig = new k8s.KubeConfig();

kubeConfig.loadFromCluster();

const k8sAPI = kubeConfig.makeApiClient(k8s.CoreV1Api);

const redisClient = new RedisClient({
    host: process.env.REDIS_BACKEND as string,
    port: parseInt(process.env.REDIS_PORT as string)
});


function signalHandler(signal: any){
    console.log(`*^!@4=> Received signal to terminate: ${signal}`)

    redisClient.quit();
}


process.on("SIGINT", signalHandler)
process.on("SIGTERM", signalHandler)




setInterval(async () => {

    const poll = await promisify(redisClient.lindex).bind(redisClient)("roomQueue", 0);


    if(poll){

        const {body} = await k8sAPI.listNamespacedPod("rooms")

        if(body.items.length <= 100){

            const roomToCreate = await promisify(redisClient.lpop).bind(redisClient)("roomQueue");

            k8sAPI.createNamespacedPod("rooms", {})


            // create the pod
        }

    }
    
}, 1000)



while (true){}



