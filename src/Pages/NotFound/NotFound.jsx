import React from 'react'
import "./NotFound.css"
import useDocumentTitle from '../../CustomHooks/useDocumentTitle'

const NotFound = () => {
  useDocumentTitle("Not Found")

  return (
    <div>NotFound</div>
  )
}

export default NotFound
