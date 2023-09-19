const jwt = require('jsonwebtoken');

const User = require('../models/User');

// get user by jwt token
const getUserByToken = async (token) => {

    if (!token) {
        throw new Error('Token de autenticação ausente ou inválido');
    };

     try {
        const decoded = jwt.verify(token, 'nossosecret');

        const userId = decoded.id;

        const user = await User.findOne({ _id: userId });

        return user;

    } catch (error) {

        throw new Error('Falha na verificação do token de autenticação');
    };
};

module.exports = getUserByToken;