import { useEffect } from "react";
import { exp } from "three/tsl";


const useDocumentTitle = (title) => {
  useEffect(()=>{
          document.title = title;
  }, [title])
}



export default useDocumentTitle;