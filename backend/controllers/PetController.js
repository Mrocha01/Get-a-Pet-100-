const Pet = require('../models/Pet');

const getToken = require('../helpers/get-token');
const getUserByToken = require('../helpers/get-user-by-token');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = class PetController {

    // create a pet 
    static async create(req, res) {

        const {
            name,
            age,
            weight,
            color,
            } = req.body;

            // images upload
            const images = req.files;

            const available = true;

            // validations
            if(!name) {
                res
                .status(422)
                .json({
                    message: ' O nome é obrigatório!'
                });
                return;
            };

            if(!age) {
                res
                .status(422)
                .json({
                    message: ' A idade é obrigatória!'
                });
                return;
            };

            if(!weight) {
                res
                .status(422)
                .json({
                    message: ' O peso é obrigatório!'
                });
                return;
            };

            if(!color) {
                res
                .status(422)
                .json({
                    message: ' A cor é obrigatória!'
                });
                return;
            };

            if(images.length === 0) {
                res
                .status(422)
                .json({
                    message: ' A imagem é obrigatória!'
                });
                return;
            };

            // get pet owner
            const token = getToken(req);
            const user = await getUserByToken(token);

            // create a pet
            const pet = new Pet({
                name,
                age,
                weight,
                color,
                images: [],
                available,
                user: {
                    _id: user._id,
                    name: user.name,
                    image: user.image,
                    phone: user.phone,
                },
            });

            images.map((image) =>{
                pet.images.push(image.filename);
            })

            try {
                const newPet = await pet.save();
                res
                .status(201)
                .json({
                    message: 'Pet cadastrado com sucesso!',
                    newPet
            });
            } catch (error) {
                res
                .status(500)
                .json({ message: error});
            }
    };

    static async getAll(req, res) {
        
        const pets = await Pet.find().sort('-createdAt');

        if(pets.length > 0){
            res
            .status(200)
            .json({ pets: pets });
        } else {
            res
            .status(200)
            .json({ message: 'Sem Pets para adoção no momento!'});
        };
        
    };

    static async getAllUserPets(req, res) {

        // get user from token
        const token = getToken(req);
        const user = await getUserByToken(token);

        const pets = await Pet.find({'user._id': user._id}).sort('-createdAt');

        if(pets.length > 0){
            res
            .status(200)
            .json({ pets: pets });
          } else {
            res
            .status(200)
            .json({ message: 'Vocẽ ainda não cadastrou nenhum PET!'});
          };
    };

    static async getAllUserAdoptions(req, res) {
          // get user from token
          const token = getToken(req);
          const user = await getUserByToken(token);
  
          const pets = await Pet.find({'adopter._id': user._id}).sort('-createdAt');

          if(pets.length > 0){
            res
            .status(200)
            .json({ pets: pets });
          } else {
            res
            .status(200)
            .json({ message: 'Nenhum Pet encontrado!'});
          };
    };

    static async getPetById(req, res) {
        const id = req.params.id;

        //check if id is valid
        if(!ObjectId.isValid(id)){
            res
            .status(422)
            .json({
                message: 'ID invalido!'
            });
            return;
        };

        // check if pet exists
        const pet = await Pet.findOne({_id: id});

        if(!pet) {
            res
            .status(404)
            .json({
                message: 'Pet não encontrado!'
            });
            return;
        };

        res
        .status(200)
        .json({pet: pet});
    };

    static async removePetById(req, res) {
        const id = req.params.id;

        //check if id is valid
        if(!ObjectId.isValid(id)){
            res
            .status(422)
            .json({
                message: 'ID invalido!'
            });
            return;
        };

         // check if pet exists
         const pet = await Pet.findOne({_id: id});

         if(!pet) {
             res
             .status(404)
             .json({
                 message: 'Pet não encontrado!'
             });
             return;
         };

         // check if user logged in registered the pet 
        const token = getToken(req);
        const user = await getUserByToken(token);

        // change the id's to types strings for easily comparison
        const petUserId = pet.user._id.toString();
        const userId = user._id.toString();

        if(petUserId !== userId) {
            res
            .status(422)
            .json({
                message: 'Pet cadastrado a outro usuario!'
            });
            return;
        };
        
        await Pet.findByIdAndRemove(id);

        res
        .status(200)
        .json({ 
            message: 'Pet removido com sucesso!' 
        });
    };

    static async updatePet(req, res) {
        const id = req.params.id;

        const {
            name,
            age,
            weight,
            color,
            available
            } = req.body;

            const images = req.files;

        const updatedData = {};
        
        // check if pet exists
        const pet = await Pet.findOne({_id: id});

        if(!pet) {
            res
            .status(404)
            .json({
                message: 'Pet não encontrado!'
            });
            return;
        };

        // check if user logged in registered the pet 
        const token = getToken(req);
        const user = await getUserByToken(token);

        // change the id's to types strings for easily comparison
        const petUserId = pet.user._id.toString();
        const userId = user._id.toString();

        if(petUserId !== userId) {
            res
            .status(422)
            .json({
                message: 'Pet cadastrado a outro usuario!'
            });
            return;
        };

          // validations
          if(!name) {
            res
            .status(422)
            .json({
                message: 'O nome é obrigatório!'
            });
            return;
        } else {
            updatedData.name = name;
        };

        if(!age) {
            res
            .status(422)
            .json({
                message: 'A idade é obrigatória!'
            });
            return;
        } else {
            updatedData.age = age;
        };

        if(!weight) {
            res
            .status(422)
            .json({
                message: 'O peso é obrigatório!'
            });
            return;
        } else {
            updatedData.weight = weight;
        };

        if(!color) {
            res
            .status(422)
            .json({
                message: 'A cor é obrigatória!'
            });
            return;
        } else {
            updatedData.color = color;
        };

        if(images.length > 0) {
            updatedData.images = [];
            images.map((image) => {
                updatedData.images.push(image.filename);
            });
        };

        await Pet.findByIdAndUpdate(id, updatedData);

        res
        .status(200)
        .json({ 
            message: 'Pet atualizado com sucesso!', 
            updatedData: updatedData
        });
    };

    static async updateSchedule(req, res) {
        const id = req.params.id;

        // check if pet exists
        const pet = await Pet.findOne({_id: id});

        if(!pet) {
            res
            .status(404)
            .json({
                message: 'Pet não encontrado!'
            });
            return;
        };

        // check if user logged in registered the pet 
        const token = getToken(req);
        const user = await getUserByToken(token);

        // check the id's with the equals form
        if(pet.user._id.equals(user._id)) {
            res
            .status(422)
            .json({
                message: 'Pet cadastrado ao usuario logado!'
            });
            return;
        };

        // check if user has already scheduled a visit
        if(pet.adopter){
            if(pet.adopter._id.equals(user._id)) {
                res
                .status(422)
                .json({
                    message: 'Já existe uma visita agendada, por favor aguarde!'
                });
                return;
            };
        };

        // add user as the adopter of the pet
        pet.adopter = {
            _id: user._id,
            name: user.name,
            image: user.image
        };

        await Pet.findByIdAndUpdate(id, pet);

        res
        .status(200)
        .json({ 
            message: `Visita agendada com sucesso! Entre em contato com ${pet.user.name} no numero ${pet.user.phone}`
        });
    };

    static async removeAdopter(req, res) {
        const id = req.params.id;
    
        // check if pet exists
        const pet = await Pet.findOne({_id: id});
    
        if (!pet) {
            res.status(404).json({
                message: 'Pet não encontrado!'
            });
            return;
        };
    
        // check if user logged in registered the pet 
        const token = getToken(req);
        const user = await getUserByToken(token);
    
        // change the id's to types strings for easy comparison
        const petUserId = pet.user._id.toString();
        const userId = user._id.toString();
    
        // check if the user is either the owner or the adopter
        if (petUserId !== userId && pet.adopter?._id.toString() !== userId) { // A ? serve para evitar erros com o retorno null
            res.status(422).json({
                message: 'Apenas o proprietário do pet ou o adotante podem remover os dados do adotante!'
            });
            return;
        }
    
        // Remove the adopter data
        pet.adopter = null;
    
        await Pet.findByIdAndUpdate(id, pet);
    
        res.status(200).json({ 
            message: 'Dados do adotante removidos com sucesso!'
        });
    };
    
    
    static async concludeAdoption(req, res) {
        const id = req.params.id;

        // check if pet exists
        const pet = await Pet.findOne({_id: id});

        if(!pet) {
            res
            .status(404)
            .json({
                message: 'Pet não encontrado!'
            });
            return;
        };

        // check if user logged in registered the pet 
        const token = getToken(req);
        const user = await getUserByToken(token);

        // change the id's to types strings for easily comparison
        const petUserId = pet.user._id.toString();
        const userId = user._id.toString();

        if(petUserId !== userId) {
            res
            .status(422)
            .json({
                message: 'Pet cadastrado a outro usuario!'
            });
            return;
        };

        pet.available = false;

        await Pet.findByIdAndUpdate(id, pet);

        res
        .status(200)
        .json({ 
            message: `Parabens! Seu pet foi adotado!`
        });
    };
};