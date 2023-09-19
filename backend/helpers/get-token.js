const getToken = (req) => {

 const authHeader = req.headers.authorization;

 if (!authHeader) {
    throw new Error('Token de autenticação não fornecido na requisição');
};

 const token = authHeader.split(" ")[1];

 return token;
};

module.exports = getToken;