import { signal } from "./signal.js";
import {html} from "./template.js";
import {mount} from "./component.js";

//component with children
 function Card({title,  children}) { 
   return html`
   <div class="card" style=${{border: '1px solid #ccc', padding: '16px', margin: '8px'}}>
    <h2>${title}</h2>
    <div class="card-body">${children}</div>
   </div>
   `
 } 
   //button component
   function Button({label, onClick }) {
     return html`<button onclick=${onclick}>${label}</button>`
   }

   //counter with internal state 
   function Counter({inital  =  0 }) {
     const [count, setCount] = signal(inital)
    
   }





}




