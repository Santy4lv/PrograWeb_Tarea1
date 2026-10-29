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

    public List<Monster> findAll() {
        return repository.findAll();
    }

    public Monster save(Monster monster) {
        return repository.save(monster);
    }

    public Monster update(Long id, Monster newDetails) {
        Monster existing = repository.findById(id).orElse(null);
        if (existing != null) {
            existing.setName(newDetails.getName());
            existing.setVirusType(newDetails.getVirusType());
            existing.setGameAppearance(newDetails.getGameAppearance());
            existing.setDangerLevel(newDetails.getDangerLevel());
            existing.setWeakness(newDetails.getWeakness());
            return repository.save(existing);
        }
        return null;
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}