# Paris1-chat

## Installation

You need to install (PYTHON)[https://gist.github.com/lukaslundgren/2659457] on your server.

```
sudo apt-get update
sudo apt-get install libldap2-dev mongodb

npm install
```
You need to configure Mongodb, see (Install mongodb)[doc/install_mongodb.md]

This application has 2 sides, a client for the user interface and a server to centralize information.

## Server side

```
npm run dev-server
```

## Client side

```
# Run the build
npm run build-client

# Run the webpack-dev-server
npm run dev-client
```

## Présentation

Messagerie instantanée de l'université Paris 1 Panthéon-Sorbonne conçue grâce à React.js pour la partie client et à Socket.io pour la partie serveur.

## Utilisation

### Onglet accueil

L'onglet d'accueil contient une section qui regroupe tous les utilisateurs connectés dans votre direction et une section "favoris". Pour ajouter un utilisateur à vos favoris, il suffit d'utiliser le click droit sur l'icone du correspondant ou de séléctionner cette option lors d'une discussion.

### Onglet messages

Dans cette onglet, vous accédez à l'historique de toutes vos conversations. Elle sont triées par ordre chronologique, de la plus récente à la plus ancienne (dernier message reçu). Vous pouvez supprimer une conversation en utilisant le click droit.

### Recherche

La barre de recherche permet de trouver une personne qui travaille dans une autre direction que la votre. Afin de revenir à l'onglet d'accueil, il faut que la barre de recherche soit vide ou commencer une discussion. Les personnes en liste rouge ne sont pas trouvable par la recherche.

### Options

Dans le menu "Options", vous pouvez mettre à jour votre statut (en ligne, occupé et invisible), activer ou désactiver les bruitages à la réception d'un nouveau message et gérer la visibilité de votre photo (Si votre correspondant ne peut pas voir votre photo, vous ne le pourrez pas non plus). En mode invisible, votre correspondant ne sera pas notifié lorsque vous écrivez un message ou lisez un message.

### Minimiser et maximiser la fenêtre

Vous pouvez minimiser le tchat en cliquant sur la barre de navigation ou dans le menu sur le bouton "minimiser". Lorsque le tchat est minimisé, il suffit de cliquer dessus pour l'agrandir.

### Déconnexion

Cliquez sur le bouton "Se déconnecter" pour quitter le tchat. Il faudra revenir sur cette page pour le réactiver.
