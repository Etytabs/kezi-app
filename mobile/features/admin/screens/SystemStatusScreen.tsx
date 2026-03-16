import React, { useEffect, useState } from "react"
import { View, Text } from "react-native"

export default function SystemStatusScreen() {

  const [status, setStatus] = useState("checking")

  useEffect(() => {

    fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`)
      .then(res => res.json())
      .then(() => setStatus("backend ok"))
      .catch(() => setStatus("backend error"))

  }, [])

  return (
    <View>
      <Text>System status:</Text>
      <Text>{status}</Text>
    </View>
  )
}