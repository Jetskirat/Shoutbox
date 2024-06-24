import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (userId, res) => {
    const token=jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: "15d"});//created token with user id as payload, encoded by jwt secret, expires in 15 days

    res.cookie("jwt", token, {//sending token ina cookie
        maxAge: 15*24*60*60*1000,//15 days
        httpOnly: true, //prevents XSS attack or cross site scripting attacks- cannot be accessed by javascript
        sameSite: "strict", //cookie will only be sent in a first-party context and not be sent along with requests initiated by third party websites, prevents cross site request forgery (CSRF) attacks
        secure: process.env.NODE_ENV === "development" ? true : false, //cookie will only be sent over HTTPS, only in production
    })
}
