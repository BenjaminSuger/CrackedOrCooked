# Cracked Or Cooked

### _"Are you cracked or cooked ?"_

Cracked (slang US) ; être très fort dans un domaine     
Cooked (slang US) ; être vraiment mauvais dans un domaine   

Découvrez si vous êtes cooked ou cracked avec les différentes questions du site. 

Les questions sont sous le format de flashcard.

Une flashcard est simplement une manière de réviser / travailler. Vous avez une question, il y a une réponse à l'arrière de cette carte. Vous évaluez si vous avez la bonne réponse ou non. 

Le choix de la flashcard est dû au fait que certaines réponses ne peuvent pas être simplement mises en QCM (mais il peut y en avoir pour certaines questions).

Il y a différents thèmes autour de la programmation et du domaine de l'informatique;     
*Python     
*C++        
*Computer Science general knowledge     
*Git        
*.....      

Ce site s'inspire de plusieurs projets existants;      
CPPQuizz.org    
Le concept des flashcard avec Anki ou Quizlet       
Entretiens d'embauche       
Videos de la chaine youtube "Coding Jesus" avec des mock interview et son site getcracked.io       
HackerRank / GeeksForGeeks      



## Vous pouvez participer ! 

Si vous le souhaitez, vous pouvez participer et ajouter des questions ! 

Pour cela, il faut respecter un format précis;
```
{
  "id": "000",
  "question": "...",
  "questionImage": "...",
  "answer": "...",
  "answerImage": "...",
  "tags": []
}
```
ID doit être une valeur numérique avec leading 0 (on ne dépassera jamais 999 questions)    
Les images sont optionnelles    
tags doit être présent pour bien rattacher au deck/thème    

### script Python

il y a un script Python "CoC.py" qui permet de transformer facilement un fichier de question pour les ajouter a votre branche.

Format de questions.txt:
En tete de fichier (optionnel, avant le premier bloc) :
    #newdeck <cle> <Nom affiche>
        Cree data/<cle>.json, images/<cle>/ et la ligne dans data/index.json.

Blocs separes par une ligne composee uniquement de tirets (3 minimum) :
    @<deck>                 obligatoire, cle du deck (ex: cpp, python, git, CS)
    @qimg <chemin>          optionnel, image de la question
    @aimg <chemin>          optionnel, image de la reponse
    Question sur une ligne
    Reponse sur les lignes suivantes (les retours a la ligne sont conserves)

Le chemin d'image est ecrit tel quel dans le JSON. Un simple nom de fichier
sans "/" est resolu en images/<deck>/<nom>. Le fichier doit exister.

Tout ou rien : si un seul bloc est invalide, rien n'est ecrit.

Il existe un example dans le repo "questions_example.txt"

## Sources des questions

A l'instar de l'interface graphique, les questions ne sont pas générées par IA. L'interface n'étant pas l'intérêt du projet.     
Il existe un Notion avec les questions qui sera mise à jour sur ce lien; **COMING SOON**        
Ce Notion est en lecture seule et ne servira que a retrouve des questions plus facilement ou a suivre l'avance des questions mise a jours.  
