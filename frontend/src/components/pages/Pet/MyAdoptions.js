import api from '../../../utils/api';

import { useState, useEffect } from 'react';

import styles from './Myadoptions.module.css';

import RoundedImage from '../../layout/Roundedimage';
import { Link } from 'react-router-dom';
import useFlashMessage from '../../../hooks/useFlashMessage';

function MyAdoptions() {
    const [pets, setPets] = useState([]);
    const [token] = useState(localStorage.getItem('token') || '');
    const {setFlashMessage} = useFlashMessage();

    useEffect(() => {
        api
        .get('/pets/myadoptions', {
            headers: {
                Authorization: `Bearer ${JSON.parse(token)}`,
              },
        })
        .then((response) => {
            if (response.data && response.data.pets) {
                setPets(response.data.pets);
            } else {
                setPets([]); // Define pets como um array vazio se a resposta não contiver pets
            }
        })
    }, [token]);

    async function removeSchedule(petId) {
        let msgType = 'success';

        const data = await api
        .patch(`pets/removeSchedule/${petId}`, {
            headers: {
                Authorization: `Bearer ${JSON.parse(token)}`,
              },
        })
        .then((response) =>{
            return response.data;
        })
        .catch((error) =>{
            msgType = 'error';
            return error.response.data;
        });

        setFlashMessage(data.message, msgType);
    };

    return (
        <section>
            <div className={styles.petlist_header}>
                <h1>Minhas Adoções</h1>
            </div>
            <div className={styles.petlist_container}>
                {pets.length > 0 && 
                    pets.map((pet) => (
                    <div className={styles.petlist_row} key={pet._id}>
                        <RoundedImage
                        src={`${process.env.REACT_APP_API}/images/pets/${pet.images[0]}`}
                        alt={pet.name}
                        width="px75"
                        />
                    <span className='bold'>{pet.name}</span>
                    <div className={styles.contacts}>
                        <p>
                          <span className={styles.bold}>Ligue para:</span> {pet.user.phone}
                        </p>
                        <p>
                          <span className={styles.bold}>Fale com:</span> {pet.user.name}
                        </p>
                    </div>
                    <div className={styles.actions}>
                    {pet.available ? (
                        <>
                        <p className={styles.bold}>Adoção em processo.</p>
                        <button className={styles.removeButton} onClick={() => removeSchedule(pet._id)}>Cancelar Visita</button>
                        </>
                    ) : (
                        <p className={styles.boldG}>Parabéns! Adoção concluida.</p>
                    )}
                    </div>
                </div>
                    ))
                }
                {pets.length === 0 && 
                <p>Ainda não há nenhum processo de adoção! 
                    <Link to={"/"}> Clique aqui</Link> para iniciar.</p>}
            </div>
        </section>
    )
}

export default MyAdoptions;