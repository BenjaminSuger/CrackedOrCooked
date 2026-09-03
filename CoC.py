#!/usr/bin/env python3
"""
CoC.py : ajoute les questions de questions.txt dans data/<deck>.json
"""

import json
import os
import re
import sys

INPUT_FILE = "questions.txt"
DATA_DIR = "data"
IMAGES_DIR = "images"
INDEX_FILE = os.path.join(DATA_DIR, "index.json")

SEPARATOR_RE = re.compile(r"^-{3,}\s*$")
NEWDECK_RE = re.compile(r"^#newdeck\s+(\S+)\s+(.+?)\s*$")


class ParseError(Exception):
    pass


# --------------------------------------------------------------------------
# Lecture de l'existant
# --------------------------------------------------------------------------

def load_index():
    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def load_deck(key):
    path = os.path.join(DATA_DIR, key + ".json")
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def deck_keys(index):
    return {os.path.splitext(d["file"])[0]: d for d in index}


# --------------------------------------------------------------------------
# Parsing de questions.txt
# --------------------------------------------------------------------------

def read_input():
    if not os.path.exists(INPUT_FILE):
        raise ParseError(f"{INPUT_FILE} introuvable")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        return f.read().splitlines()


def split_header_and_blocks(lines):
    """Retourne (liste de #newdeck, liste de blocs). Un bloc = liste de lignes."""
    newdecks = []
    blocks = []
    current = []
    in_header = True

    for lineno, raw in enumerate(lines, 1):
        line = raw.rstrip()

        if in_header:
            if line.startswith("#newdeck"):
                m = NEWDECK_RE.match(line)
                if not m:
                    raise ParseError(
                        f"ligne {lineno}: '#newdeck' invalide, "
                        f"attendu '#newdeck <cle> <Nom affiche>'"
                    )
                newdecks.append((m.group(1), m.group(2)))
                continue
            if line.strip() == "" and not current:
                continue
            in_header = False

        if SEPARATOR_RE.match(line):
            if current:
                blocks.append(current)
                current = []
            continue

        current.append(line)

    if current:
        blocks.append(current)

    blocks = [b for b in blocks if any(l.strip() for l in b)]
    return newdecks, blocks


def parse_block(block, blockno, known_decks):
    """Retourne un dict {deck, question, answer, questionImage, answerImage}."""
    lines = list(block)

    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()

    deck = None
    qimg = ""
    aimg = ""
    idx = 0

    while idx < len(lines) and lines[idx].startswith("@"):
        parts = lines[idx].split(None, 1)
        directive = parts[0][1:]
        arg = parts[1].strip() if len(parts) > 1 else ""

        if directive in ("qimg", "aimg"):
            if not arg:
                raise ParseError(f"bloc {blockno}: '@{directive}' sans chemin")
            if directive == "qimg":
                qimg = arg
            else:
                aimg = arg
        else:
            if deck is not None:
                raise ParseError(
                    f"bloc {blockno}: deck declare deux fois ('@{deck}' puis '@{directive}')"
                )
            if arg:
                raise ParseError(
                    f"bloc {blockno}: '@{directive} {arg}' inconnu"
                )
            if directive not in known_decks:
                raise ParseError(
                    f"bloc {blockno}: deck '@{directive}' inconnu "
                    f"(decks: {', '.join(sorted(known_decks))})"
                )
            deck = directive
        idx += 1

    if deck is None:
        raise ParseError(f"bloc {blockno}: aucun '@<deck>' en tete de bloc")

    text = lines[idx:]
    while text and not text[0].strip():
        text.pop(0)

    if not text:
        raise ParseError(f"bloc {blockno}: question vide")

    question = text[0].strip()
    answer_lines = [l.rstrip() for l in text[1:]]
    while answer_lines and not answer_lines[0].strip():
        answer_lines.pop(0)

    if not answer_lines:
        raise ParseError(f"bloc {blockno}: reponse vide")

    answer = "\n".join(answer_lines)
    # Un "\n" ecrit a la main dans le texte devient un vrai retour a la ligne.
    answer = answer.replace("\\n", "\n")
    answer = answer.replace("—", "--")
    question = question.replace("—", "--")

    def resolve_image(p):
        if not p:
            return ""
        if "/" not in p:
            p = f"{IMAGES_DIR}/{deck}/{p}"
        if not os.path.exists(p):
            raise ParseError(f"bloc {blockno}: image introuvable '{p}'")
        return p

    return {
        "deck": deck,
        "question": question,
        "questionImage": resolve_image(qimg),
        "answer": answer,
        "answerImage": resolve_image(aimg),
    }


# --------------------------------------------------------------------------
# Programme principal
# --------------------------------------------------------------------------

def main():
    errors = []

    try:
        index = load_index()
    except Exception as e:
        print(f"ERREUR: impossible de lire {INDEX_FILE}: {e}")
        return 1

    known = deck_keys(index)

    try:
        lines = read_input()
        newdecks, blocks = split_header_and_blocks(lines)
    except ParseError as e:
        print(f"ERREUR: {e}")
        return 1

    # Nouveaux decks 
    for key, name in newdecks:
        if key in known:
            errors.append(f"#newdeck: la cle '{key}' existe deja")
        elif not re.fullmatch(r"[A-Za-z0-9_+-]+", key):
            errors.append(f"#newdeck: cle '{key}' invalide (lettres, chiffres, _ + - seulement)")
        else:
            known[key] = {"name": name, "file": key + ".json"}

    if not blocks and not newdecks:
        print("Rien a faire : aucun bloc dans questions.txt")
        return 0

    # Parsing de tous les blocs
    parsed = []
    for i, block in enumerate(blocks, 1):
        try:
            parsed.append(parse_block(block, i, known))
        except ParseError as e:
            errors.append(str(e))

    # Chargement des decks concernes et detection de doublons
    decks = {}
    for entry in parsed:
        key = entry["deck"]
        if key not in decks:
            decks[key] = load_deck(key)

    seen = {key: {q["question"].strip() for q in cards} for key, cards in decks.items()}
    for i, entry in enumerate(parsed, 1):
        key = entry["deck"]
        q = entry["question"]
        if q in seen[key]:
            errors.append(f"question deja presente dans '{key}': \"{q[:60]}\"")
        else:
            seen[key].add(q)

    if errors:
        print(f"{len(errors)} erreur(s), rien n'a ete ecrit :")
        for e in errors:
            print(f"  - {e}")
        return 1

    # Attribution des ids et ajout
    added = {}
    for entry in parsed:
        key = entry["deck"]
        cards = decks[key]
        next_id = max((int(c["id"]) for c in cards), default=-1) + 1
        cards.append({
            "id": str(next_id).zfill(3),
            "question": entry["question"],
            "questionImage": entry["questionImage"],
            "answer": entry["answer"],
            "answerImage": entry["answerImage"],
            "tags": [key],
        })
        added[key] = added.get(key, 0) + 1

    # Ecriture : nouveaux decks d'abord
    for key, name in newdecks:
        os.makedirs(os.path.join(IMAGES_DIR, key), exist_ok=True)
        path = os.path.join(DATA_DIR, key + ".json")
        if key not in decks:
            with open(path, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2, ensure_ascii=False)
                f.write("\n")
        index.append({"name": name, "file": key + ".json"})
        print(f"Nouveau deck '{key}' ({name}) cree")

    if newdecks:
        with open(INDEX_FILE, "w", encoding="utf-8") as f:
            json.dump(index, f, indent=2, ensure_ascii=False)
            f.write("\n")

    for key, cards in decks.items():
        path = os.path.join(DATA_DIR, key + ".json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(cards, f, indent=2, ensure_ascii=False)
            f.write("\n")

    total = 0
    for key, n in sorted(added.items()):
        print(f"{key}: +{n} question(s) (total {len(decks[key])})")
        total += n
    print(f"Termine : {total} question(s) ajoutee(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
