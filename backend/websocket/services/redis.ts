import { promisify } from 'util';
import { RedisClient } from 'redis';
import { Container, Service } from 'typedi';

@Service()
export class RedisService{

    private _pubClient: RedisClient;
    private _subClient: RedisClient;


    constructor(){
         this._pubClient = new RedisClient({host: process.env.REDIS_BACKEND as string, port: parseInt(process.env.REDIS_PORT as string)})
         this._subClient = this._pubClient.duplicate();
    }


    get pubClient() : RedisClient{
        return this._pubClient;
    }

    get subClient() : RedisClient{
        return this._subClient;
    }


    public asyncExists(key: string) {
		return new Promise((resolve, reject) => {
			this._pubClient.exists(key, (err, res) => {
				if (err) {
					return reject(err);
				}

				return resolve(!!res);
			});
		});
	}

	public asyncGet(key: string) {
        return promisify(this._pubClient.get).bind(this._pubClient)(key)
	}

	public asyncSet(key: string, value: string) {
        return promisify(this._pubClient.set).bind(this._pubClient)(key, value)
	}

}