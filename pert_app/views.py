from django.shortcuts import render

# Create your views here.

# pert_app/views.py
import json
import tempfile
from django.http import JsonResponse, HttpResponseBadRequest
from .utils import calcul_pert
from pyvis.network import Network

def index(request):
    # page initiale : le HTML contient le JS qui fera POST à /generate/
    return render(request, 'index.html', {})

def generate_pert(request):
    if request.method != 'POST':
        return HttpResponseBadRequest("POST attendu")

    try:
        data = json.loads(request.body.decode('utf-8'))
        taches = data.get('taches', [])
        # validation minimale
        if not isinstance(taches, list):
            raise ValueError("Format invalide pour 'taches'")
        result, G = calcul_pert(taches)

        # génération du graphe pyvis
        net = Network(height="600px", width="100%", directed=True, notebook=False)
        # ajoute noeuds
        for r in result:
            n = r['tache']
            label = f"{n}\nDur:{G.nodes[n]['duree']}\nES:{r['ES']} EF:{r['EF']}"
            color = "red" if r['critique'] else "#9fc5f8"
            net.add_node(n, label=label, color=color, title=label)
        # ajoute edges
        for u, v in G.edges:
            net.add_edge(u, v)

        # on sauve dans un fichier temporaire et on lit son html
        path = tempfile.mktemp(suffix=".html")
        net.save_graph(path)
        with open(path, 'r', encoding='utf-8') as f:
            diagram_html = f.read()

        return JsonResponse({'success': True, 'result': result, 'diagram_html': diagram_html})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
