import { render } from "ejs";
import { readdirSync, readFileSync } from "fs";
import { createTestAccount, createTransport, Transporter } from "nodemailer";
import { resolve } from "path";
import { Service } from "typedi";


@Service()
export class EmailService{

    private templates: any;

    private mail: Transporter | undefined;


    constructor(){

       createTestAccount().then(testAccount => {

            this.mail = createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth:{
                    user: testAccount.user, 
                    pass: testAccount.pass, 
                }
            })
    

        });
        


        this.templates = {};
        const rootPath = resolve("./email-templates/")


        // load all of our templates into memory to increase performance
        readdirSync(rootPath).forEach(file => {
            this.templates[file.split(".")[0]] = readFileSync(rootPath + file, "utf-8")
        })

    }



    public sendVerifyEmail(email: string, username:string, token: string){
        return this.mail?.sendMail({
            from: '"Screenhive No Reply" no-reply@screenhive.io',
            to: email,
            subject: "Please Verify Your Email!",
            html: render(this.templates["verify-email"], {username, verifyUrl: `http://screenhive.io:4200/verify?token=${token}`})
        })
    }


}