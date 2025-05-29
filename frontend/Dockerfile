FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN ls -l node_modules/.bin && ls -l node_modules/next
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
