import { useState } from "react"
import { useEffect } from "react"


export default function App() {
  const [filesInDIR, setFilesInDIR] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:4000/")
        const data = await res.json()
        console.log(data)
        setFilesInDIR(data)
      } catch (error) {
        console.error(error.message)
      }
    }

    fetchData()
  }, [])

  return (
    <>
      <h1>My Files</h1>
        {filesInDIR.map((file, index) => (    
          <div key={index}>
            {file} <a href={`http://localhost:4000/${file}?action=open`}>Open</a>{" "}<a href={`http://localhost:4000/${file}?action=download`}>Download</a>
          </div>
        ))}
    </>
  )
}