# pert_app/urls.py
from django.urls import path
from . import views

app_name = 'pert_app'

urlpatterns = [
    path('', views.index, name='index'),
    path('generate/', views.generate_pert, name='generate_pert'),
]
