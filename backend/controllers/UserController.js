const User = require('../models/User');
const Pet = require('../models/Pet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helpers
const createUserToken = require('../helpers/create-user-token');
const getToken = require('../helpers/get-token');
const getUserByToken = require('../helpers/get-user-by-token');

module.exports = class UserController {

    static async register(req, res) {
        const { name, email, phone, password, confirmpassword } = req.body;
        
        // Validations
        const errors = [];

        if (!name || !email || !phone) {
            errors
            .push('As informações de nome, e-mail e telefone são obrigatórias!');
        };

        if (!password || !confirmpassword) {
            errors
            .push('Por favor preencha a senha e a sua confirmação!');
        } else if (password !== confirmpassword) {
            errors
            .push('A senha precisa ser igual à sua confirmação!');
        };

        // Additional Format Validations
        if (!isValidEmail(email)) {
            errors
            .push('Por favor, insira um endereço de e-mail válido.');
        };

        if (!isValidPhoneNumber(phone)) {
            errors
            .push('Por favor, insira um número de telefone válido.');
        };

        // Check if user already exists
        const userExists = await User.findOne({ email: email });

        if (userExists) {
            errors
            .push('E-mail já cadastrado, tente novamente!');
        };

        if (errors.length > 0) {
            res
            .status(422)
            .json({message: errors });
            return;
        }

         // create a password
         const salt = await bcrypt.genSalt(12);
         const passwordHash = await bcrypt.hash(password, salt);

         // create a user
         const user = new User({
             name: name,
             email: email,
             phone: phone,
             password: passwordHash
      });

        try {
            // All validations passed, proceed to registration
            const newUser = await user.save();

            await createUserToken(newUser, req, res);
            
        } catch (error) {
            res
            .status(500)
            .json({message: error})
        };
    };

    static async login(req, res) {
        // Validations
        const errors = [];
        
        const {email, password} = req.body;

        if (!email) {
            errors
            .push('Insira o e-mail!');
        };

        if (!password) {
            errors
            .push(' Insira a senha!');
        };

        if (errors.length > 0) {
            res
            .status(422)
            .json({message: errors });
            return;
        };

         // Check if user already exists
         const user = await User.findOne({ email: email });
 
         if (!user) {
             errors
             .push(' E-mail não cadastrado, tente novamente!');
         } else {
            // check if password match with db password
            const checkPassword = await bcrypt.compare(password, user.password);

            if (!checkPassword) {
                errors
                .push(' Senha inválida, tente novamente!');
            };
         };

        if (errors.length > 0) {
            res
            .status(422)
            .json({message: errors });
            return;
        };
    
        await createUserToken(user, req, res);
    };

    static async checkUser(req, res) {
        
        let currentUser 

        if(req.headers.authorization) { 

            const token = getToken(req);
            const decoded = jwt.verify(token, 'nossosecret');

            currentUser = await User.findById(decoded.id);
            currentUser.password = undefined;

        } else {
            currentUser = null;
        };

        res.status(200).send(currentUser);
    };

    static async getUserById(req, res) {
       
        const id = req.params.id;

        const user = await User.findById(id).select('-password');

        if(!user) {
            res
            .status(422)
            .json({
                message: 'Usuario não encontrado!',
             });
             return;
        };

        res
        .status(200)
        .json({ user: user });
    };

    static async editUser(req, res) {
         
        // Validations
        const errors = [];

        // check if user already exists
        const token = getToken(req);
        const user = await getUserByToken(token);

        const {name, email, phone, password, confirmpassword} = req.body;

        if(req.file) {
            user.image = req.file.filename;
        }

        if (!name || !email || !phone) {
            errors
            .push('As informações de nome, e-mail e telefone são obrigatórias!');
        };

        if (errors.length > 0) {
            res
            .status(422)
            .json({message: errors });
            return;
        };

        // check if email is already taken
        const userExists = await User.findOne({email: email});

        if(user.email !== email && userExists) {
            res
            .status(422)
            .json({
                message: 'E-mail já cadastrado!',
            });
            return;
            };

            user.name = name;
            user.email = email;
            user.phone = phone;

        if(password !== confirmpassword) {
            errors
            .push('A senha precisa ser igual à sua confirmação!');
        } else if (password === confirmpassword && password != null) {
            // creating a new password
            const salt = await bcrypt.genSalt(12);
            const passwordHash = await bcrypt.hash(password, salt);

            user.password = passwordHash;
        };

        if (errors.length > 0) {
            res
            .status(422)
            .json({message: errors });
            return;
        };
       
        try {
            // All validations passed, proceed to edit

            // Atualizar o usuário
             const updatedUser = await User.findByIdAndUpdate(user._id, user, { new: true });

            // Atualizar os pets relacionados ao usuário
            await Pet.updateMany({ 'user._id': updatedUser._id }, {
                $set: {
                    'user.name': updatedUser.name,
                    'user.image': updatedUser.image,
                    'user.phone': updatedUser.phone,
                }
            });

            // Atualizar os pets relacionados a adoção pelo usuário
                await Pet.updateMany({ 'adopter._id': updatedUser._id }, {
                $set: {
                    'adopter.name': updatedUser.name,
                    'adopter.image': updatedUser.image,
                    'adopter.phone': updatedUser.phone,
                }
            });

            res
            .status(200)
            .json({ message: 'Usuário atualizado com sucesso!' });
            
        } catch (error) {
            res
                .status(500)
                .json({ message: error.message });
            return;
        };

    };
};

//? Preciso desativar do case sensitive a inicial do e-mail
//! essas validações ainda seguem como dúvida para o projeto;
function isValidEmail(email) {
    // Implement your email validation logic here
    return true; // Replace with actual validation
};

function isValidPhoneNumber(phone) {
    // Implement your phone number validation logic here
    return true; // Replace with actual validation
};