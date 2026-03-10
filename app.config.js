export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      openaiApiKey: process.env.OPENAI_API_KEY,
    },
  };
};
