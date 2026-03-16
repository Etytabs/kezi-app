const check = async () => {
  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch("http://localhost:3001/health");
    if (res.ok) {
      const data = await res.json();
      console.log("Backend OK", data);
    } else {
      console.log("Backend FAILED with status:", res.status);
    }
  } catch (error) {
    console.log("Backend FAILED");
    console.error(error);
  }
};

check();
