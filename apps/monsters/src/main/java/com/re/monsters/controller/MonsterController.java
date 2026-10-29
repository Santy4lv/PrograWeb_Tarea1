package com.re.monsters.controller;

import com.re.monsters.model.Monster;
import com.re.monsters.service.MonsterService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monsters")
@CrossOrigin(origins = "*")
public class MonsterController {

    private final MonsterService service;

    public MonsterController(MonsterService service) {
        this.service = service;
    }

    // GET
    @GetMapping
    public List<Monster> getAllMonsters() {
        return service.findAll();
    }

    // POST
    @PostMapping
    public ResponseEntity<Monster> createMonster(@RequestBody Monster monster) {
        Monster saved = service.save(monster);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // PUT: Mandatory id path variable
    @PutMapping("/{id}")
    public ResponseEntity<Monster> updateMonster(@PathVariable("id") Long id, @RequestBody Monster monster) {
        Monster updated = service.update(id, monster);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // DELETE: Mandatory id path variable
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMonster(@PathVariable("id") Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}