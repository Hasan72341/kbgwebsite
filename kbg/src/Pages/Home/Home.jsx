import React from 'react'
import "./Home.css"
import useDocumentTitle from '../../CustomHooks/useDocumentTitle'
import useToggle from '../../CustomHooks/useToggle'

const Home = () => {
  useDocumentTitle("Home")
  const [isToggled, toggle] = useToggle(false); // Using custom toggle hook

  return (
    <div>
      <h1>Home</h1>
      <button onClick={toggle}>{isToggled ? "ON" : "OFF"}</button>{/** Toggle button */ }
    </div>
  )
}

export default Home
