/**
 * Script Google Apps Script pour convertir les onglets Google Docs en news.json
 * Chaque onglet = un article
 * 
 * INSTALLATION:
 * 1. Ouvre ton Google Doc des news
 * 2. Extensions > Apps Script
 * 3. Colle ce code
 * 4. Configure les variables ci-dessous
 * 5. Exécute la fonction "publishToGitHub"
 */

// ========== CONFIGURATION ==========
const GITHUB_TOKEN = 'ghp_TON_TOKEN_GITHUB'; // À créer sur GitHub > Settings > Developer settings > Personal access tokens
const GITHUB_OWNER = 'Obsidian-Chrome'; // Ton username GitHub
const GITHUB_REPO = 'magenta'; // Nom de ton repo
const GITHUB_BRANCH = 'main'; // Ou 'gh-pages' selon ta config
const FILE_PATH = 'public/news.json'; // Chemin du fichier dans le repo

// ========== FONCTION PRINCIPALE ==========
function publishToGitHub() {
  try {
    // 1. Lire le document actif
    const doc = DocumentApp.getActiveDocument();
    const tabs = doc.getTabs();
    
    if (tabs.length === 0) {
      DocumentApp.getUi().alert('Aucun onglet trouvé dans le document.');
      return;
    }
    
    // 2. Parser chaque onglet
    const articles = [];
    tabs.forEach((tab, index) => {
      const article = parseTab(tab, index + 1);
      if (article) {
        articles.push(article);
      }
    });
    
    if (articles.length === 0) {
      DocumentApp.getUi().alert('Aucun article valide trouvé. Vérifie le format.');
      return;
    }
    
    // 3. Trier par date décroissante
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 4. Convertir en JSON
    const jsonContent = JSON.stringify(articles, null, 2);
    
    // 5. Push sur GitHub
    const success = pushToGitHub(jsonContent);
    
    if (success) {
      DocumentApp.getUi().alert('✅ ' + articles.length + ' news publiées avec succès sur GitHub !');
    } else {
      DocumentApp.getUi().alert('❌ Erreur lors de la publication. Vérifie la console.');
    }
    
  } catch (error) {
    Logger.log('Erreur: ' + error);
    DocumentApp.getUi().alert('Erreur: ' + error.message);
  }
}

// ========== PARSER UN ONGLET ==========
function parseTab(tab, articleId) {
  try {
    const tabName = tab.getTitle();
    const body = tab.asDocumentTab().getBody();
    const text = body.getText();
    
    // Structure attendue dans chaque onglet:
    // Titre: ...
    // Date: ...
    // Image: ...
    // Lien: ...
    // 
    // Contenu:
    // ...
    
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
    
    let article = {
      id: articleId,
      title: '',
      content: '',
      date: '',
      image: '',
      link: ''
    };
    
    let inContent = false;
    let contentStartIndex = -1;
    
    lines.forEach((line, idx) => {
      if (line.startsWith('Titre:')) {
        article.title = line.replace('Titre:', '').trim();
      } else if (line.startsWith('Date:')) {
        article.date = line.replace('Date:', '').trim();
      } else if (line.startsWith('Image:')) {
        article.image = line.replace('Image:', '').trim();
      } else if (line.startsWith('Lien:')) {
        article.link = line.replace('Lien:', '').trim();
      } else if (line === 'Contenu:') {
        inContent = true;
        contentStartIndex = idx;
      }
    });
    
    // Extraire le contenu avec formatage Markdown
    if (inContent && contentStartIndex >= 0) {
      article.content = extractMarkdownContent(body, contentStartIndex);
    }
    
    // Si pas de titre/date/contenu explicites, utiliser le nom de l'onglet comme titre
    if (!article.title) {
      article.title = tabName;
    }
    
    // Valider l'article (au minimum titre et date)
    if (article.title && article.date) {
      return article;
    }
    
    Logger.log('Onglet "' + tabName + '" ignoré: manque titre ou date');
    return null;
    
  } catch (error) {
    Logger.log('Erreur parsing onglet: ' + error);
    return null;
  }
}

// ========== EXTRAIRE LE CONTENU EN MARKDOWN ==========
function extractMarkdownContent(body, contentStartIndex) {
  const numChildren = body.getNumChildren();
  const markdownLines = [];
  let foundContentMarker = false;
  
  for (let i = 0; i < numChildren; i++) {
    const child = body.getChild(i);
    const childType = child.getType();
    
    if (childType === DocumentApp.ElementType.PARAGRAPH) {
      const paragraph = child.asParagraph();
      const text = paragraph.getText().trim();
      
      // Skip jusqu'à trouver "Contenu:"
      if (!foundContentMarker) {
        if (text === 'Contenu:') {
          foundContentMarker = true;
        }
        continue;
      }
      
      // Skip les lignes vides
      if (!text) {
        markdownLines.push('');
        continue;
      }
      
      // Extraire le texte avec formatage
      const formattedText = extractFormattedText(paragraph);
      markdownLines.push(formattedText);
      
    } else if (childType === DocumentApp.ElementType.LIST_ITEM) {
      const listItem = child.asListItem();
      const text = listItem.getText().trim();
      
      if (!foundContentMarker) continue;
      if (!text) continue;
      
      const formattedText = extractFormattedText(listItem);
      const glyphType = listItem.getGlyphType();
      
      // Liste numérotée ou à puces
      if (glyphType === DocumentApp.GlyphType.NUMBER) {
        markdownLines.push('1. ' + formattedText);
      } else {
        markdownLines.push('- ' + formattedText);
      }
    }
  }
  
  // Nettoyer les lignes vides consécutives excessives
  let cleanedLines = [];
  let previousWasEmpty = false;
  
  for (let i = 0; i < markdownLines.length; i++) {
    const line = markdownLines[i];
    const isEmpty = line.trim() === '';
    
    if (isEmpty) {
      if (!previousWasEmpty) {
        cleanedLines.push(line);
      }
      previousWasEmpty = true;
    } else {
      cleanedLines.push(line);
      previousWasEmpty = false;
    }
  }
  
  return cleanedLines.join('\n\n').trim();
}

// ========== EXTRAIRE LE TEXTE AVEC FORMATAGE ==========
function extractFormattedText(element) {
  const textElement = element.editAsText();
  const text = textElement.getText();
  if (!text) return '';
  
  let result = '';
  let currentBold = null;
  let currentItalic = null;
  let buffer = '';
  
  for (let i = 0; i < text.length; i++) {
    const isBold = textElement.isBold(i);
    const isItalic = textElement.isItalic(i);
    
    // Détection de changement de style
    if (isBold !== currentBold || isItalic !== currentItalic) {
      // Flush le buffer avec l'ancien style
      if (buffer) {
        if (currentBold && currentItalic) {
          result += '***' + buffer + '***';
        } else if (currentBold) {
          result += '**' + buffer + '**';
        } else if (currentItalic) {
          result += '*' + buffer + '*';
        } else {
          result += buffer;
        }
        buffer = '';
      }
      
      // Mettre à jour le style actuel
      currentBold = isBold;
      currentItalic = isItalic;
    }
    
    buffer += text.charAt(i);
  }
  
  // Flush le dernier buffer
  if (buffer) {
    if (currentBold && currentItalic) {
      result += '***' + buffer + '***';
    } else if (currentBold) {
      result += '**' + buffer + '**';
    } else if (currentItalic) {
      result += '*' + buffer + '*';
    } else {
      result += buffer;
    }
  }
  
  return result;
}

// ========== PUSH SUR GITHUB ==========
function pushToGitHub(content) {
  try {
    // 1. Récupérer le SHA du fichier actuel
    const getUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${GITHUB_BRANCH}`;
    const getOptions = {
      method: 'get',
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json'
      },
      muteHttpExceptions: true
    };
    
    const getResponse = UrlFetchApp.fetch(getUrl, getOptions);
    let sha = null;
    
    if (getResponse.getResponseCode() === 200) {
      const fileData = JSON.parse(getResponse.getContentText());
      sha = fileData.sha;
    }
    
    // 2. Encoder le contenu en base64 avec UTF-8
    const encodedContent = Utilities.base64Encode(content, Utilities.Charset.UTF_8);
    
    // 3. Créer/Mettre à jour le fichier
    const putUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;
    const payload = {
      message: 'Update news from Google Docs - ' + new Date().toISOString(),
      content: encodedContent,
      branch: GITHUB_BRANCH
    };
    
    if (sha) {
      payload.sha = sha;
    }
    
    const putOptions = {
      method: 'put',
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json'
      },
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const putResponse = UrlFetchApp.fetch(putUrl, putOptions);
    const responseCode = putResponse.getResponseCode();
    
    Logger.log('GitHub Response: ' + responseCode);
    Logger.log('Response body: ' + putResponse.getContentText());
    
    return responseCode === 200 || responseCode === 201;
    
  } catch (error) {
    Logger.log('Erreur GitHub: ' + error);
    return false;
  }
}

// ========== MENU PERSONNALISÉ ==========
function onOpen() {
  DocumentApp.getUi()
    .createMenu('Magenta News')
    .addItem('Publier sur le site', 'publishToGitHub')
    .addItem('Prévisualiser JSON', 'previewJSON')
    .addItem('Aide', 'showHelp')
    .addToUi();
}

function previewJSON() {
  const doc = DocumentApp.getActiveDocument();
  const tabs = doc.getTabs();
  const articles = [];
  
  tabs.forEach((tab, index) => {
    const article = parseTab(tab, index + 1);
    if (article) {
      articles.push(article);
    }
  });
  
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));
  const jsonContent = JSON.stringify(articles, null, 2);
  
  const ui = DocumentApp.getUi();
  ui.alert('Prévisualisation JSON (' + articles.length + ' articles)', jsonContent, ui.ButtonSet.OK);
}

function showHelp() {
  const helpText = `
Format de chaque onglet:

Titre: Ton titre ici
Date: 2026-04-29
Image: https://lien-image.png
Lien: https://exemple.com

Contenu:
Ton article ici...
Plusieurs paragraphes possibles.

---

Champs obligatoires: Titre, Date
Champs optionnels: Image, Lien, Contenu

Un onglet = un article
  `;
  
  DocumentApp.getUi().alert('Aide - Format des articles', helpText, DocumentApp.getUi().ButtonSet.OK);
}
