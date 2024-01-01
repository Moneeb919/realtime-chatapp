import { Redis } from "@upstash/redis";

export const db = new Redis({
    url: "https://apn1-relieved-dogfish-35101.upstash.io",
    token: "AYkdASQgZDdhNTMwY2UtZjNmMi00NjVjLTg0OTItODg4OTUyYzMxZGZjZDkwNGQ5YjFjMTUyNGQ4YTk5MTc1YjdjY2Q1OTVhMjg="
})