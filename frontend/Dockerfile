FROM oven/bun:1

WORKDIR /claud

COPY bun.lock package.json ./

RUN bun install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD [ "bun", "run", "dev", "--host"]
