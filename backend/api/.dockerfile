FROM node

WORKDIR /usr/src/app

COPY . .

RUN npm install && npm install typescript -g
RUN npx prisma generate
RUN npm run build

EXPOSE 8080

CMD ["node", "./dist/index.js"]