FROM oven/bun:1

WORKDIR /claud

COPY bun.lock package.json ./

RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD [ "bun", "run", "dev" ]
