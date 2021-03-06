const bcrypt = require ('bcrypt'); //importation du package de chiffrement bcrypt pour protéger et hasher et saler le mdp
const User = require ('../models/User'); //importation du modèle d'utilisateur
const jwt = require('jsonwebtoken'); //importation du package jsonwebtoken, permet échange et vérification des données entre interlocuteurs
const cryptoJS = require('crypto-js'); // importation de crypto JS pour crypter le mail
require('dotenv').config();//utilisation des variables d'environnement

//création compte utilisateur
exports.signup = (req, res, next) => {
  const cryptedEmail = cryptoJS.HmacSHA256(req.body.email, process.env.MAIL_SECRET_KEY).toString();
  console.log(cryptedEmail)
  bcrypt.hash(req.body.password, 10) //appel fonction de hachage de bcrypt dans mot de passe - mdp salé 10fois
    // Création d'un nouvel utilisateur et enregistrement dans la BDD
    .then(hash => {
      const user = new User({
        email: cryptedEmail,
        password: hash
      });
      user.save()
        .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
    
};

//connection compte utilisateur
exports.login = (req, res, next) => {
  const cryptedEmail = cryptoJS.HmacSHA256(req.body.email,  process.env.MAIL_SECRET_KEY).toString();
  User.findOne({email: cryptedEmail})
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Utilisateur non trouvé !' });
      }
      bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) {
            return res.status(401).json({ error: 'Mot de passe incorrect !' });
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign(
              { userId: user._id },
              'process.env.DB_TOKEN',
              { expiresIn: '24h' }
            )
          });
        })
        .catch(error => res.status(500).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};
