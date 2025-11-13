FROM oven/bun:1

WORKDIR /claud

# Dependencies will be installed via volume mount
# This allows hot reloading and code changes to be detected

EXPOSE 3000

CMD sh -c "bun install && bun run dev"
