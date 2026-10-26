CREATE TABLE monsters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    virus_type VARCHAR(50) NOT NULL,
    game_appearance VARCHAR(100) NOT NULL,
    danger_level INT NOT NULL,
    weakness VARCHAR(150)
);

INSERT INTO monsters (name, virus_type, game_appearance, danger_level, weakness) VALUES
('Zombie', 'T-Virus', 'Resident Evil 1 & 2', 3, 'Fire / Headshots'),
('Licker', 'T-Virus', 'Resident Evil 2', 7, 'Sound Sensitivity / Blindness'),
('Nemesis T-Type', 'NE-Alpha + T-Virus', 'Resident Evil 3', 10, 'Rocket Launcher / Acid'),
('Ganado', 'Las Plagas', 'Resident Evil 4', 5, 'Flash Grenade');