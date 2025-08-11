export const generateCode = (codeType) => {
    const codeLength = codeType === "user" ? 7 : 6;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < codeLength; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return code;  
}



