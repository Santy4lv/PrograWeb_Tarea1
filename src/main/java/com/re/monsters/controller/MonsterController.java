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
    public List<Monster> obtenerMonstruos() {
        return service.listarTodos();
    }

    // POST
    @PostMapping
    public ResponseEntity<Monster> crearMonstruo(@RequestBody Monster monster) {
        Monster guardado = service.guardar(monster);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    // PUT: Nota el ("id") obligatorio
    @PutMapping("/{id}")
    public ResponseEntity<Monster> actualizarMonstruo(@PathVariable("id") Long id, @RequestBody Monster monster) {
        Monster actualizado = service.actualizar(id, monster);
        if (actualizado != null) {
            return ResponseEntity.ok(actualizado);
        }
        return ResponseEntity.notFound().build();
    }

    // DELETE: Nota el ("id") obligatorio
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarMonstruo(@PathVariable("id") Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}