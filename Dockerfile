FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .

RUN npx tsc

RUN touch sessao.json && chmod 777 sessao.json

EXPOSE 3000

CMD ["node", "server.js"]