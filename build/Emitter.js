var s=()=>{let e={};return{on:(t,n)=>{e[t]||(e[t]=[]),e[t].push(n)},emit:(t,n)=>{let r=e[t];r&&r.forEach(i=>i(n))}}};export{s as createEmitter};
