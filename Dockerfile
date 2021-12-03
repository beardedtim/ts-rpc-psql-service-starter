FROM node:17

WORKDIR /app

COPY . .

RUN npm i --production

RUN npm run build

ENV PORT 5000

EXPOSE 5000

CMD ["nmp", "run", "start"]