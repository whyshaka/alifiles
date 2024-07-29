import { useContext } from "react"
import { GlobalContext } from "../../context"
import { stripHTML } from "../helpers";

export default function CMS_String_Field({
    id, // Unique ID (Firestore document object key)
    placeholder, // Default text
    c, // Custom className
}) {
    
    const {websiteContent} = useContext(GlobalContext);

    return <span 
        id={id} 
        className={"cp-editable " + c}>{
            websiteContent[id] 
                ? stripHTML(websiteContent[id]) 
                : placeholder
        }</span>
}
