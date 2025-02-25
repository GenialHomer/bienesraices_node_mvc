import bcrypt from 'bcrypt'

const usuarios = [
    {
        nombre: 'Omar',
        email: 'correo@correo.com',
        confirmado: 1,
        password: bcrypt.hashSync('1', 10)
    },
    {
        nombre: 'Alejandro',
        email: 'correo2@correo.com',
        confirmado: 1,
        password: bcrypt.hashSync('2', 10)
    }

]

export default usuarios