import { Service, Inject } from 'typedi';
import { UserService } from './UserService';
import jsonwebtoken from 'jsonwebtoken';
import { PrismaService } from './PrismaService';
import { PrismaClient } from '.prisma/client';

@Service()
export class RevokedTokenService {
	private prisma: PrismaClient;
	constructor(private user: UserService, private prismaService: PrismaService) {
		this.prisma = this.prismaService.prisma;
	}


    public async isTokenRevoked(token: string){
        return (await this.prisma.revokedToken.count({where:{token: token.split('.')[2]}})) > 0;
    }

	public async revokeToken(id: number, refresh: string) {
		const user = await this.user.getUser({ id });

        const signature = refresh.split('.')[2];

		if (user && this.prisma.revokedToken.findFirst({ where: { token: signature } })) {
			let decoded = jsonwebtoken.verify(refresh, process.env.JWT_SECRET as string) as any;

			await this.prisma.revokedToken.create({
				data: {
					userId: user.id,
					token: signature,
					expiry: new Date(decoded.exp * 1000)
				}
			});

			return true;
		}

		return false;
	}
}
