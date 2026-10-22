package com.re.monsters.service;

import com.re.monsters.model.Monster;
import com.re.monsters.repository.MonsterRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MonsterService {

    private final MonsterRepository repository;

    public MonsterService(MonsterRepository repository) {
        this.repository = repository;
    }

    public List<Monster> listarTodos() {
        return repository.findAll();
    }

    public Monster guardar(Monster monster) {
        return repository.save(monster);
    }

    public Monster actualizar(Long id, Monster datosNuevos) {
        Monster existente = repository.findById(id).orElse(null);
        if (existente != null) {
            existente.setName(datosNuevos.getName());
            existente.setVirusType(datosNuevos.getVirusType());
            existente.setGameAppearance(datosNuevos.getGameAppearance());
            existente.setDangerLevel(datosNuevos.getDangerLevel());
            existente.setWeakness(datosNuevos.getWeakness());
            return repository.save(existente);
        }
        return null;
    }

    public void eliminar(Long id) {
        repository.deleteById(id);
    }
}