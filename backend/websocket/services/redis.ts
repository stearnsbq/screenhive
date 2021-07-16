import { promisify } from 'util';
import { RedisClient } from 'redis';
import { Container, Service } from 'typedi';
import Redlock from 'redlock';

@Service()
export class RedisService {
	private _pubClient: RedisClient;
	private _subClient: RedisClient;
	private _lock: Redlock;

	constructor() {
		this._pubClient = new RedisClient({
			host: process.env.REDIS_BACKEND as string,
			port: parseInt(process.env.REDIS_PORT as string)
		});
		this._subClient = this._pubClient.duplicate();
		this._lock = new Redlock([ this._pubClient ], {
			driftFactor: 0.01,
			retryCount: 10,
			retryDelay: 200,
			retryJitter: 200
		});
	}

	get pubClient(): RedisClient {
		return this._pubClient;
	}

	get subClient(): RedisClient {
		return this._subClient;
	}

	lock(resource: string, ttl: number) {
		return this._lock.lock(resource, ttl);
	}



	public asyncLRem(key: string, count: number, valToRemove:string){
		return promisify(this._pubClient.lrem).bind(this._pubClient)(key, count, valToRemove);
	}

	public asyncLPos(key: string, val: string){
		return promisify(this._pubClient.sendCommand).bind(this._pubClient)(`LPOS ${key} ${val}`) as Promise<number>;
	}

	public asyncRPush(key: string, val: string){
		return new Promise<number>((resolve, reject) => {
			this._pubClient.rpush(key, val, (err, res) => {
				if (err) {
					return reject(err);
				}

				return resolve(res);
			});
		});
	}

	public asyncGetAll(hash: string) {
		return promisify(this._pubClient.hgetall).bind(this._pubClient)(hash);
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

	public del(key: string) {
		return new Promise((resolve, reject) => {
			this._pubClient.del(key, (err, res) => {
				if (err) {
					return reject(err);
				}

				return resolve(!!res);
			});
		});
	}

	public asyncHDel(hash: string, key: string) {
		return new Promise((resolve, reject) => {
			this._pubClient.hdel(key, hash, (err, res) => {
				if (err) {
					return reject(err);
				}

				return resolve(!!res);
			});
		});
	}

	public asyncDel(key: string) {
		return new Promise((resolve, reject) => {
			this._pubClient.del(key, (err, res) => {
				if (err) {
					return reject(err);
				}

				return resolve(!!res);
			});
		});
	}

	public asyncHExists(hash: string, key: string) {
		return promisify(this._pubClient.hexists).bind(this._pubClient)(hash, key);
	}

	public asyncGet(key: string) {
		return promisify(this._pubClient.get).bind(this._pubClient)(key);
	}

	public asyncHGet(hash: string, key: string) {
		return promisify(this._pubClient.hget).bind(this._pubClient)(hash, key);
	}

	public asyncSet(key: string, value: string) {
		return promisify(this._pubClient.set).bind(this._pubClient)(key, value);
	}

	public asyncHSet(hash: string, key: string, value: string) {
		return promisify(this._pubClient.hset).bind(this._pubClient)([ hash, key, value ]);
	}

	public asyncSetEx(key: string, value: string, expiry: number) {
		return promisify(this._pubClient.setex)(key, expiry, value);
	}
}
