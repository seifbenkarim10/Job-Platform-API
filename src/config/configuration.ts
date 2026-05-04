export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  mongodb: {
    uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27018/job-platform',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
});
