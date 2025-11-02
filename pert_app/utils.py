# pert_app/utils.py
import networkx as nx

def calcul_pert(taches):
    """
    taches: liste de dicts :
    [{'nom':'A','duree':3,'pred':[]}, ...]
    renvoie: (result, G)
    result = [{'tache':..., 'ES':..., 'EF':..., 'LS':..., 'LF':..., 'MT':..., 'ML':..., 'critique': bool}, ...]
    """
    G = nx.DiGraph()
    # création des noeuds
    for t in taches:
        name = t['nom']
        duree = int(t['duree'])
        G.add_node(name, duree=duree)

    # création des arcs (prédécesseurs)
    for t in taches:
        for p in t.get('pred', []):
            if not G.has_node(p):
                # sécurité : si prédécesseur inconnu on l'ajoute (duree 0)
                G.add_node(p, duree=0)
            G.add_edge(p, t['nom'])

    if not nx.is_directed_acyclic_graph(G):
        # cycle détecté : on lève une erreur identifiable par la vue
        raise ValueError("Cycle détecté dans les dépendances — vérifiez vos prédécesseurs.")

    # calcul ES, EF
    es = {}
    ef = {}
    for node in nx.topological_sort(G):
        preds = list(G.predecessors(node))
        es[node] = max([ef[p] for p in preds] or [0])
        ef[node] = es[node] + G.nodes[node]['duree']

    # calcul LF, LS (retour arrière)
    lf = {}
    ls = {}
    # date de fin du projet = max ef des noeuds
    projet_fin = max(ef.values()) if ef else 0
    for node in reversed(list(nx.topological_sort(G))):
        succs = list(G.successors(node))
        if succs:
            lf[node] = min([ls[s] for s in succs])
        else:
            lf[node] = projet_fin
        ls[node] = lf[node] - G.nodes[node]['duree']

    result = []
    for node in G.nodes:
        mt = lf[node] - ef[node]
        # marge libre: min(ls[succ] - ef[node]) pour successeurs, ou mt si pas de successeurs
        succs = list(G.successors(node))
        if succs:
            ml = min([ls[s] - ef[node] for s in succs])
        else:
            ml = mt
        result.append({
            'tache': node,
            'ES': es[node],
            'EF': ef[node],
            'LS': ls[node],
            'LF': lf[node],
            'MT': mt,
            'ML': ml,
            'critique': mt == 0
        })

    # Optionnel : trier result pour affichage cohérent (topological)
    topo = list(nx.topological_sort(G))
    result_sorted = sorted(result, key=lambda r: topo.index(r['tache']))

    return result_sorted, G
