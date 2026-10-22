CREATE TABLE monsters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    virus_type VARCHAR(50) NOT NULL,
    game_appearance VARCHAR(100) NOT NULL,
    danger_level INT NOT NULL,
    weakness VARCHAR(150)
);

INSERT INTO monsters (name, virus_type, game_appearance, danger_level, weakness) VALUES
('Zombie', 'T-Virus', 'Resident Evil 1 & 2', 3, 'Fuego / Cabeza'),
('Licker', 'T-Virus', 'Resident Evil 2', 7, 'Ruido / Ceguera'),
('Nemesis T-Type', 'NE-Alpha + T-Virus', 'Resident Evil 3', 10, 'Lanzacohetes / Acido'),
('Ganado', 'Las Plagas', 'Resident Evil 4', 5, 'Granada de luz');