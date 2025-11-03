// Variables globales
let taches = [];
let resultatsPERT = [];
let cheminCritique = [];

// Éléments DOM
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const taskForm = document.getElementById('taskForm');
const tasksTableBody = document.getElementById('tasksTableBody');
const pertResultsBody = document.getElementById('pertResultsBody');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');
const clearFormBtn = document.getElementById('clearFormBtn');
const applyDatesBtn = document.getElementById('applyDatesBtn');
const t0Input = document.getElementById('t0');
const tfInput = document.getElementById('tf');
const displayT0 = document.getElementById('displayT0');
const displayTf = document.getElementById('displayTf');
const totalDuration = document.getElementById('totalDuration');
const criticalPathElement = document.getElementById('criticalPath');
const exportPNGBtn = document.getElementById('exportPNGBtn');
const exportPDFBtn = document.getElementById('exportPDFBtn');
const taskCount = document.getElementById('taskCount');

// Événements
document.addEventListener('DOMContentLoaded', function() {
    console.log('Application PERT initialisée');
    
    // Initialisation - T0 a une valeur par défaut de 1, Tf est vide
    t0Input.value = '1'; // Valeur par défaut pour T0
    tfInput.value = '';  // Tf reste vide
    displayT0.textContent = '1';
    displayTf.textContent = '?'; 
    updateTasksTable();
    calculerPERT();
    
    // Gestion des onglets
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Si on passe à l'onglet diagramme, générer le diagramme
            if (tabId === 'diagram') {
                genererDiagrammePERT();
            }
        });
    });
    
    // Gestion du formulaire de tâche
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        ajouterTache();
    });
    
    // Bouton effacer le formulaire
    clearFormBtn.addEventListener('click', function() {
        taskForm.reset();
    });
    
    // Bouton réinitialiser
    resetBtn.addEventListener('click', function() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser le projet ? Toutes les données seront perdues.')) {
            reinitialiserProjet();
        }
    });
    
    // Bouton appliquer les dates
    applyDatesBtn.addEventListener('click', function() {
        appliquerDates();
    });
    
    // Bouton exporter
    exportBtn.addEventListener('click', function() {
        exporterProjet();
    });
    
    // Boutons d'export du diagramme
    exportPNGBtn.addEventListener('click', function() {
        exporterDiagramme('PNG');
    });
    
    exportPDFBtn.addEventListener('click', function() {
        exporterDiagramme('PDF');
    });
});

// Fonctions

// Ajouter une tâche
function ajouterTache() {
    const idTache = document.getElementById('taskId').value.toUpperCase();
    const nomTache = document.getElementById('taskName').value;
    const dureeTache = parseInt(document.getElementById('taskDuration').value);
    const predecesseursTache = document.getElementById('taskPredecessors').value
        .split(',')
        .map(p => p.trim().toUpperCase())
        .filter(p => p !== '');
    
    // Validation
    if (!idTache || !nomTache || !dureeTache) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }
    
    if (dureeTache < 1) {
        alert('La durée doit être au moins de 1 jour.');
        return;
    }
    
    // Vérifier si le code tâche existe déjà
    if (taches.some(tache => tache.id === idTache)) {
        alert('Une tâche avec ce code existe déjà.');
        return;
    }
    
    // Ajouter la tâche
    taches.push({
        id: idTache,
        nom: nomTache,
        duree: dureeTache,
        predecesseurs: predecesseursTache,
        successeurs: []
    });
    
    // Mettre à jour les successeurs
    mettreAJourSuccesseurs();
    
    // Mettre à jour l'affichage
    updateTasksTable();
    calculerPERT();
    
    // Réinitialiser le formulaire
    taskForm.reset();
    
    // Afficher un message de succès
    afficherAlerte('Tâche ajoutée avec succès.', 'success');
}

// Mettre à jour les successeurs
function mettreAJourSuccesseurs() {
    // Réinitialiser les successeurs
    taches.forEach(tache => {
        tache.successeurs = [];
    });
    
    // Mettre à jour les successeurs
    taches.forEach(tache => {
        tache.predecesseurs.forEach(predId => {
            const tachePred = taches.find(t => t.id === predId);
            if (tachePred && !tachePred.successeurs.includes(tache.id)) {
                tachePred.successeurs.push(tache.id);
            }
        });
    });
}

// Mettre à jour le tableau des tâches
function updateTasksTable() {
    tasksTableBody.innerHTML = '';
    
    taches.forEach(tache => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><strong>${tache.id}</strong></td>
            <td>${tache.nom}</td>
            <td>${tache.duree} jour(s)</td>
            <td>${tache.predecesseurs.join(', ') || '-'}</td>
            <td class="actions">
                <button class="btn btn-secondary" onclick="modifierTache('${tache.id}')">Modifier</button>
                <button class="btn btn-danger" onclick="supprimerTache('${tache.id}')">Supprimer</button>
            </td>
        `;
        
        tasksTableBody.appendChild(row);
    });
    
    // Mettre à jour le compteur de tâches
    taskCount.textContent = `${taches.length} tâche${taches.length > 1 ? 's' : ''}`;
}

// Modifier une tâche
function modifierTache(idTache) {
    const tache = taches.find(t => t.id === idTache);
    
    if (tache) {
        document.getElementById('taskId').value = tache.id;
        document.getElementById('taskId').disabled = true;
        document.getElementById('taskName').value = tache.nom;
        document.getElementById('taskDuration').value = tache.duree;
        document.getElementById('taskPredecessors').value = tache.predecesseurs.join(', ');
        
        // Changer le bouton d'ajout en bouton de modification
        const submitBtn = taskForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Modifier';
        submitBtn.onclick = function(e) {
            e.preventDefault();
            mettreAJourTache(idTache);
        };
        
        // Ajouter un bouton annuler
        if (!document.getElementById('cancelEditBtn')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'cancelEditBtn';
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.textContent = 'Annuler';
            cancelBtn.onclick = function() {
                annulerModification();
            };
            
            taskForm.querySelector('.btn-group').appendChild(cancelBtn);
        }
    }
}

// Mettre à jour une tâche
function mettreAJourTache(idTache) {
    const indexTache = taches.findIndex(t => t.id === idTache);
    
    if (indexTache !== -1) {
        const nomTache = document.getElementById('taskName').value;
        const dureeTache = parseInt(document.getElementById('taskDuration').value);
        const predecesseursTache = document.getElementById('taskPredecessors').value
            .split(',')
            .map(p => p.trim().toUpperCase())
            .filter(p => p !== '');
        
        // Mettre à jour la tâche
        taches[indexTache].nom = nomTache;
        taches[indexTache].duree = dureeTache;
        taches[indexTache].predecesseurs = predecesseursTache;
        
        // Mettre à jour les successeurs
        mettreAJourSuccesseurs();
        
        // Mettre à jour l'affichage
        updateTasksTable();
        calculerPERT();
        
        // Réinitialiser le formulaire
        annulerModification();
        
        // Afficher un message de succès
        afficherAlerte('Tâche modifiée avec succès.', 'success');
    }
}

// Annuler la modification
function annulerModification() {
    taskForm.reset();
    document.getElementById('taskId').disabled = false;
    
    const submitBtn = taskForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Ajouter';
    submitBtn.onclick = function(e) {
        e.preventDefault();
        ajouterTache();
    };
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.remove();
    }
}

// Supprimer une tâche
function supprimerTache(idTache) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la tâche ${idTache} ?`)) {
        // Supprimer la tâche
        taches = taches.filter(tache => tache.id !== idTache);
        
        // Mettre à jour les successeurs
        mettreAJourSuccesseurs();
        
        // Mettre à jour l'affichage
        updateTasksTable();
        calculerPERT();
        
        // Afficher un message de succès
        afficherAlerte('Tâche supprimée avec succès.', 'success');
    }
}

// Appliquer les dates T0 et Tf
function appliquerDates() {
    let t0 = parseInt(t0Input.value);
    let tf = parseInt(tfInput.value);
    
    // Validation de T0 - si vide, utiliser la valeur par défaut 1
    if (isNaN(t0) || t0Input.value.trim() === '') {
        t0 = 1; // Valeur par défaut
        t0Input.value = '1'; // Mettre à jour l'input
    }
    
    if (t0 < 0) {
        alert('La date T0 doit être un nombre valide (≥ 0).');
        return;
    }
    
    // Si Tf n'est pas spécifié (champ vide), calculer automatiquement
    if (isNaN(tf) || tfInput.value.trim() === '') {
        // Calculer Tf automatiquement basé sur les tâches (fin au plus tôt)
        tf = calculerFinAuPlusTot(t0);
        tfInput.value = ''; // Garder le champ vide
        displayTf.textContent = tf; // Afficher la valeur calculée
    } else {
        // Tf est spécifié manuellement
        if (tf <= t0) {
            alert('La date Tf doit être supérieure à T0.');
            return;
        }
        displayTf.textContent = tf;
    }
    
    displayT0.textContent = t0;
    
    // Recalculer PERT avec les nouvelles dates
    calculerPERT();
    
    // Afficher un message de succès
    afficherAlerte('Dates appliquées avec succès.', 'success');
}

// Calculer la fin au plus tôt automatiquement
function calculerFinAuPlusTot(t0) {
    if (taches.length === 0) {
        return t0; // Si pas de tâches, fin = début
    }
    
    // Réinitialiser les dates
    taches.forEach(tache => {
        tache.debutTot = undefined;
        tache.finTot = undefined;
    });
    
    // Calculer les dates au plus tôt pour trouver la fin du projet
    let finMax = t0;
    let changement = true;
    
    // Itérer jusqu'à ce que toutes les dates soient calculées
    while (changement) {
        changement = false;
        
        taches.forEach(tache => {
            if (tache.debutTot === undefined) {
                if (tache.predecesseurs.length === 0) {
                    // Tâche sans prédécesseur
                    tache.debutTot = t0;
                    tache.finTot = t0 + tache.duree - 1;
                    changement = true;
                } else {
                    // Vérifier si tous les prédécesseurs ont leurs dates calculées
                    const predecesseursCalcules = tache.predecesseurs.every(predId => {
                        const pred = taches.find(t => t.id === predId);
                        return pred && pred.finTot !== undefined;
                    });
                    
                    if (predecesseursCalcules) {
                        let finTotMax = t0 - 1;
                        
                        tache.predecesseurs.forEach(predId => {
                            const pred = taches.find(t => t.id === predId);
                            if (pred && pred.finTot > finTotMax) {
                                finTotMax = pred.finTot;
                            }
                        });
                        
                        tache.debutTot = finTotMax + 1;
                        tache.finTot = tache.debutTot + tache.duree - 1;
                        changement = true;
                    }
                }
                
                if (tache.finTot > finMax) {
                    finMax = tache.finTot;
                }
            }
        });
    }
    
    // Retourner la fin au plus tôt (dernière fin de tâche)
    return finMax;
}

// Calculer les dates PERT
function calculerPERT() {
    if (taches.length === 0) {
        // Réinitialiser les affichages si pas de tâches
        pertResultsBody.innerHTML = '';
        totalDuration.textContent = '0';
        criticalPathElement.textContent = '-';
        return;
    }
    
    // Réinitialiser les résultats
    resultatsPERT = [];
    cheminCritique = [];
    
    const t0 = parseInt(displayT0.textContent);
    let tf = parseInt(displayTf.textContent);
    
    // Si Tf n'est pas défini (encore "?"), calculer automatiquement
    if (isNaN(tf) || displayTf.textContent === '?') {
        tf = calculerFinAuPlusTot(t0);
        displayTf.textContent = tf;
    }
    
    // Calculer les dates au plus tôt
    calculerDatesTot();
    
    // Calculer les dates au plus tard
    calculerDatesTard();
    
    // Calculer les marges
    calculerMarges();
    
    // Déterminer le chemin critique
    determinerCheminCritique();
    
    // Mettre à jour l'affichage des résultats
    mettreAJourResultatsPERT();
}

// Calculer les dates au plus tôt
function calculerDatesTot() {
    // Réinitialiser les dates
    taches.forEach(tache => {
        tache.debutTot = undefined;
        tache.finTot = undefined;
    });
    
    const t0 = parseInt(displayT0.textContent);
    let finMax = t0;
    let changement = true;
    
    // Itérer jusqu'à ce que toutes les dates soient calculées
    while (changement) {
        changement = false;
        
        taches.forEach(tache => {
            if (tache.debutTot === undefined) {
                if (tache.predecesseurs.length === 0) {
                    // Tâche sans prédécesseur
                    tache.debutTot = t0;
                    tache.finTot = t0 + tache.duree - 1;
                    changement = true;
                } else {
                    // Vérifier si tous les prédécesseurs ont leurs dates calculées
                    const predecesseursCalcules = tache.predecesseurs.every(predId => {
                        const pred = taches.find(t => t.id === predId);
                        return pred && pred.finTot !== undefined;
                    });
                    
                    if (predecesseursCalcules) {
                        let finTotMax = t0 - 1;
                        
                        tache.predecesseurs.forEach(predId => {
                            const pred = taches.find(t => t.id === predId);
                            if (pred && pred.finTot > finTotMax) {
                                finTotMax = pred.finTot;
                            }
                        });
                        
                        tache.debutTot = finTotMax + 1;
                        tache.finTot = tache.debutTot + tache.duree - 1;
                        changement = true;
                    }
                }
                
                if (tache.finTot > finMax) {
                    finMax = tache.finTot;
                }
            }
        });
    }
}

// Calculer les dates au plus tard
function calculerDatesTard() {
    const tf = parseInt(displayTf.textContent);
    
    // Réinitialiser les dates au plus tard
    taches.forEach(tache => {
        tache.debutTard = undefined;
        tache.finTard = undefined;
    });
    
    let changement = true;
    
    // Itérer jusqu'à ce que toutes les dates soient calculées
    while (changement) {
        changement = false;
        
        taches.forEach(tache => {
            if (tache.finTard === undefined) {
                if (tache.successeurs.length === 0) {
                    // Tâche sans successeur
                    tache.finTard = tf;
                    tache.debutTard = tf - tache.duree + 1;
                    changement = true;
                } else {
                    // Vérifier si tous les successeurs ont leurs dates calculées
                    const successeursCalcules = tache.successeurs.every(succId => {
                        const succ = taches.find(t => t.id === succId);
                        return succ && succ.debutTard !== undefined;
                    });
                    
                    if (successeursCalcules) {
                        let debutTardMin = Infinity;
                        
                        tache.successeurs.forEach(succId => {
                            const succ = taches.find(t => t.id === succId);
                            if (succ && succ.debutTard < debutTardMin) {
                                debutTardMin = succ.debutTard;
                            }
                        });
                        
                        tache.finTard = debutTardMin - 1;
                        tache.debutTard = tache.finTard - tache.duree + 1;
                        changement = true;
                    }
                }
            }
        });
    }
}

// Calculer les marges
function calculerMarges() {
    taches.forEach(tache => {
        if (tache.debutTot !== undefined && tache.debutTard !== undefined) {
            // Marge totale
            tache.margeTotale = tache.debutTard - tache.debutTot;
            
            // Marge libre
            if (tache.successeurs.length === 0) {
                tache.margeLibre = 0;
            } else {
                let debutTotMin = Infinity;
                
                tache.successeurs.forEach(succId => {
                    const succ = taches.find(t => t.id === succId);
                    if (succ && succ.debutTot < debutTotMin) {
                        debutTotMin = succ.debutTot;
                    }
                });
                
                tache.margeLibre = debutTotMin - tache.finTot - 1;
                if (tache.margeLibre < 0) tache.margeLibre = 0;
            }
        }
    });
}

// Déterminer le chemin critique
function determinerCheminCritique() {
    cheminCritique = [];
    
    // Trouver les tâches avec marge totale nulle
    const tachesCritiques = taches.filter(tache => 
        tache.margeTotale === 0 && tache.debutTot !== undefined
    );
    
    // Trier les tâches critiques par date de début au plus tôt
    tachesCritiques.sort((a, b) => a.debutTot - b.debutTot);
    
    // Construire le chemin critique
    cheminCritique = tachesCritiques.map(tache => tache.id);
    
    // Mettre à jour l'affichage
    criticalPathElement.textContent = cheminCritique.join(' → ');
    
    // Calculer la durée totale
    if (tachesCritiques.length > 0) {
        const premiereTache = tachesCritiques[0];
        const derniereTache = tachesCritiques[tachesCritiques.length - 1];
        totalDuration.textContent = derniereTache.finTot - premiereTache.debutTot + 1;
    } else {
        totalDuration.textContent = '0';
    }
}

// Trier les tâches dans l'ordre topologique
function triTopologique() {
    const visite = {};
    const pile = [];
    
    taches.forEach(tache => {
        if (!visite[tache.id]) {
            triTopologiqueUtil(tache.id, visite, pile);
        }
    });
    
    return pile.reverse();
}

// Fonction utilitaire pour le tri topologique
function triTopologiqueUtil(idTache, visite, pile) {
    visite[idTache] = true;
    
    const tache = taches.find(t => t.id === idTache);
    
    tache.successeurs.forEach(succId => {
        if (!visite[succId]) {
            triTopologiqueUtil(succId, visite, pile);
        }
    });
    
    pile.push(idTache);
}

// Mettre à jour l'affichage des résultats PERT
function mettreAJourResultatsPERT() {
    pertResultsBody.innerHTML = '';
    
    // Trier les tâches par code
    const tachesTriees = [...taches].sort((a, b) => a.id.localeCompare(b.id));
    
    tachesTriees.forEach(tache => {
        const row = document.createElement('tr');
        const estCritique = cheminCritique.includes(tache.id);
        
        // Vérifier si les dates sont calculées
        const debutTot = tache.debutTot !== undefined ? tache.debutTot : '?';
        const finTot = tache.finTot !== undefined ? tache.finTot : '?';
        const debutTard = tache.debutTard !== undefined ? tache.debutTard : '?';
        const finTard = tache.finTard !== undefined ? tache.finTard : '?';
        const margeTotale = tache.margeTotale !== undefined ? tache.margeTotale : '?';
        const margeLibre = tache.margeLibre !== undefined ? tache.margeLibre : '?';
        
        row.innerHTML = `
            <td class="${estCritique ? 'critical-path' : ''}"><strong>${tache.id}</strong></td>
            <td>${tache.duree}</td>
            <td>${debutTot}</td>
            <td>${finTot}</td>
            <td>${debutTard}</td>
            <td>${finTard}</td>
            <td>${margeTotale}</td>
            <td>${margeLibre}</td>
        `;
        
        pertResultsBody.appendChild(row);
    });
}

// Générer le diagramme PERT avec vis-network
function genererDiagrammePERT() {
    const container = document.getElementById('pertChart');
    container.innerHTML = '';
    
    if (taches.length === 0) {
        container.innerHTML = '<div class="no-data">Aucune tâche à afficher. Ajoutez des tâches pour générer le diagramme PERT.</div>';
        return;
    }

    // Créer le conteneur pour vis-network avec des dimensions flexibles
    const networkContainer = document.createElement('div');
    networkContainer.id = 'network';
    networkContainer.style.width = '100%';
    networkContainer.style.height = '500px'; // Réduit la hauteur pour laisser de la place aux boutons
    networkContainer.style.minHeight = '400px';
    networkContainer.style.border = '1px solid #ddd';
    networkContainer.style.borderRadius = '8px';
    networkContainer.style.background = '#f8fafc';
    networkContainer.style.overflow = 'hidden'; // Empêche tout débordement
    container.appendChild(networkContainer);

    // Préparer les données pour vis-network
    const nodes = [];
    const edges = [];
    
    // Ajouter les nœuds (tâches)
    taches.forEach(tache => {
        const estCritique = cheminCritique.includes(tache.id);
        
        nodes.push({
            id: tache.id,
            label: `${tache.id}\n${tache.duree}j`,
            color: estCritique ? {
                background: '#ef4444',
                border: '#dc2626',
                highlight: { background: '#f87171', border: '#dc2626' }
            } : {
                background: '#3b82f6',
                border: '#1e40af',
                highlight: { background: '#60a5fa', border: '#1e40af' }
            },
            font: { 
                color: 'white', 
                size: 14, // Taille réduite pour mieux s'adapter
                face: 'Arial', 
                bold: true 
            },
            shape: 'box',
            margin: 8,
            widthConstraint: { minimum: 70, maximum: 90 }, // Taille réduite des nœuds
            heightConstraint: { minimum: 50, maximum: 70 }
        });
    });
    
    // Ajouter les arêtes (dépendances)
    taches.forEach(tache => {
        tache.predecesseurs.forEach(predId => {
            // Vérifier que le prédécesseur existe dans les tâches
            if (taches.some(t => t.id === predId)) {
                const estCritique = cheminCritique.includes(predId) && cheminCritique.includes(tache.id);
                
                edges.push({
                    id: `${predId}-${tache.id}`,
                    from: predId,
                    to: tache.id,
                    color: estCritique ? { color: '#ef4444', width: 3 } : { color: '#3b82f6', width: 2 },
                    arrows: 'to',
                    smooth: { enabled: true, type: 'cubicBezier', roundness: 0.3 }
                });
            }
        });
    });

    // Configuration optimisée pour l'espace disponible
    const options = {
        layout: {
            hierarchical: {
                enabled: true,
                direction: 'LR', // De gauche à droite
                sortMethod: 'directed',
                nodeSpacing: 120, // Espacement réduit entre les nœuds
                levelSeparation: 150, // Séparation réduite entre les niveaux
                shakeTowards: 'leaves'
            }
        },
        physics: {
            enabled: false // Layout statique pour éviter les mouvements
        },
        interaction: {
            dragNodes: true,
            dragView: true,
            zoomView: true,
            zoomSpeed: 0.5 // Vitesse de zoom réduite pour plus de contrôle
        },
        nodes: {
            shape: 'box',
            shadow: false, // Ombre désactivée pour un rendu plus net
            margin: 10,
            font: {
                multi: true
            }
        },
        edges: {
            smooth: {
                enabled: true,
                type: 'cubicBezier',
                roundness: 0.2
            },
            shadow: false
        },
        configure: {
            enabled: false // Désactive le panneau de configuration
        }
    };

    // Créer le réseau
    const data = {
        nodes: nodes,
        edges: edges
    };
    
    const network = new vis.Network(networkContainer, data, options);

    // Ajustement automatique pour s'adapter au conteneur
    network.on('afterDrawing', function() {
        // Ajuste la vue pour que tout soit visible sans débordement
        network.fit({
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
        
        // Applique un léger zoom arrière pour avoir une marge
        network.moveTo({
            scale: 0.9, // Zoom à 90% pour avoir des marges
            animation: {
                duration: 300,
                easingFunction: 'easeInOutQuad'
            }
        });
    });

    // Redimensionner automatiquement quand la fenêtre change de taille
    window.addEventListener('resize', function() {
        network.redraw();
        network.fit();
    });
}

function exporterDiagramme(format) {
    const networkContainer = document.getElementById('network');
    
    if (!networkContainer || taches.length === 0) {
        alert('Aucun diagramme à exporter. Génerez d\'abord un diagramme en ajoutant des tâches.');
        return;
    }

    if (format === 'PNG') {
        html2canvas(networkContainer).then(canvas => {
            const link = document.createElement('a');
            link.download = 'diagramme-pert.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    } else if (format === 'PDF') {
        html2canvas(networkContainer).then(canvas => {
            const pdf = new jspdf.jsPDF('landscape');
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save('diagramme-pert.pdf');
        });
    }
}

// Exporter le projet
function exporterProjet() {
    if (taches.length === 0) {
        alert('Aucune donnée à exporter. Ajoutez des tâches d\'abord.');
        return;
    }
    
    const donneesProjet = {
        taches: taches.map(tache => ({
            id: tache.id,
            nom: tache.nom,
            duree: tache.duree,
            predecesseurs: tache.predecesseurs,
            successeurs: tache.successeurs
        })),
        t0: parseInt(displayT0.textContent),
        tf: parseInt(displayTf.textContent),
        cheminCritique: cheminCritique,
        resultatsPERT: taches.map(tache => ({
            id: tache.id,
            debutTot: tache.debutTot,
            finTot: tache.finTot,
            debutTard: tache.debutTard,
            finTard: tache.finTard,
            margeTotale: tache.margeTotale,
            margeLibre: tache.margeLibre
        }))
    };
    
    const dataStr = JSON.stringify(donneesProjet, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.download = 'projet-pert.json';
    link.href = URL.createObjectURL(dataBlob);
    link.click();
}

// Réinitialiser le projet
function reinitialiserProjet() {
    taches = [];
    resultatsPERT = [];
    cheminCritique = [];
    
    updateTasksTable();
    mettreAJourResultatsPERT();
    
    t0Input.value = '1'; // Remettre la valeur par défaut
    tfInput.value = ''; // Laisser vide
    displayT0.textContent = '1';
    displayTf.textContent = '?'; // Remettre "?" 
    totalDuration.textContent = '0';
    criticalPathElement.textContent = '-';
    
    // Réinitialiser le formulaire
    annulerModification();
    
    // Vider le diagramme
    const container = document.getElementById('pertChart');
    container.innerHTML = '<div class="no-data">Aucune tâche à afficher. Ajoutez des tâches pour générer le diagramme PERT.</div>';
    
    // Afficher un message de succès
    afficherAlerte('Projet réinitialisé avec succès.', 'success');
}

// Afficher une alerte
function afficherAlerte(message, type) {
    // Supprimer les alertes existantes
    const alertesExistantes = document.querySelectorAll('.alert');
    alertesExistantes.forEach(alerte => alerte.remove());
    
    // Créer l'alerte
    const alerte = document.createElement('div');
    alerte.className = `alert alert-${type}`;
    alerte.textContent = message;
    
    // Ajouter l'alerte en haut de la page
    const container = document.querySelector('.container');
    container.insertBefore(alerte, container.firstChild);
    
    // Supprimer l'alerte après 5 secondes
    setTimeout(() => {
        if (alerte.parentNode) {
            alerte.parentNode.removeChild(alerte);
        }
    }, 5000);
}