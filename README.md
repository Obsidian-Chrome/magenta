# MAGENTA // Site Web Officiel

Site web style Cyberpunk 2077 pour le groupe punk/grunge/rock **Magenta**.

## 🎸 Fonctionnalités

### Musique
- Albums avec pochettes et liens YouTube d'albums
- Lecteur audio intégré avec tous les contrôles (play, pause, suivant, précédent, volume, shuffle, repeat)
- Détection automatique de la durée des musiques
- Liens YouTube par track
- Téléchargement MP3

### Concerts
- Liste des concerts avec dates, lieux, horaires
- Liens Discord par concert
- Détection automatique des concerts passés (affichés en grisé avec badge "TERMINÉ")

### Merch
- Images de présentation
- Tags personnalisables
- Détection automatique du poids des fichiers (en MO)
- Téléchargement direct

### Accueil
- Affichage automatique des 3 derniers sons
- Affichage automatique des 3 prochains concerts

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build
npm run preview
```

## 📝 Modifier le contenu

**Les données sont séparées dans 3 fichiers JSON :**
- `public/albums.json` - Albums et tracks
- `public/concerts.json` - Dates de concerts
- `public/merch.json` - Merch téléchargeable

### Ajouter un album (`public/albums.json`)

```json
{
  "title": "Nom de l'album",
  "cover": "/media/pochette.png",
  "year": "2024",
  "youtubeAlbumLink": "https://youtube.com/playlist?list=...",
  "tracks": [
    {
      "name": "Nom de la musique",
      "youtube": "https://youtube.com/watch?v=...",
      "mp3": "/media/track.mp3"
    }
  ]
}
```

### Ajouter un concert (`public/concerts.json`)

```json
{
  "date": "2024-12-31",
  "venue": "Nom de la salle",
  "city": "Ville",
  "time": "20:00",
  "discord": "https://discord.gg/..."
}
```

### Ajouter un merch (`public/merch.json`)

```json
{
  "name": "Nom du merch",
  "image": "/media/preview.png",
  "file": "/media/download.zip",
  "tags": ["tag1", "tag2", "tag3"]
}
```

## 📁 Structure des fichiers

- `public/albums.json` - **Albums et musiques**
- `public/concerts.json` - **Dates de concerts**
- `public/merch.json` - **Merch téléchargeable**
- `public/media/` - Images et fichiers audio/merch
- `src/components/AudioPlayer.jsx` - Lecteur audio
- `src/App.jsx` - Composant principal
- `src/index.css` - Styles Cyberpunk 2077

## 🎨 Design

Design inspiré de Cyberpunk 2077 avec :
- **Couleurs** : Noir (#000), Magenta (#FF00FF), Jaune (#FFFF00)
- **Formes angulaires** avec clip-path polygonal
- **Effets néon** et glitches
- **Hexagones** pour les icônes
- **Gradients** Magenta/Jaune
- **Typographie** : Orbitron (display) et Rajdhani (body)

## 🎵 Lecteur Audio

Contrôles disponibles :
- ▶️ Play / Pause
- ⏮️ Piste précédente
- ⏭️ Piste suivante
- 🔀 Shuffle (lecture aléatoire)
- 🔁 Repeat (boucle sur toutes / boucle sur une)
- 🔊 Volume et mute
- Timeline cliquable

## 🔧 Technologies

- React 18
- Vite
- TailwindCSS
- Lucide React (icônes)
- Google Fonts (Orbitron, Rajdhani)
