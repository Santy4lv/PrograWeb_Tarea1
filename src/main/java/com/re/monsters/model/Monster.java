package com.re.monsters.model;

import jakarta.persistence.*;

@Entity
@Table(name = "monsters")
public class Monster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "virus_type", nullable = false)
    private String virusType;

    @Column(name = "game_appearance", nullable = false)
    private String gameAppearance;

    @Column(name = "danger_level", nullable = false)
    private Integer dangerLevel;

    private String weakness;

    public Monster() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVirusType() { return virusType; }
    public void setVirusType(String virusType) { this.virusType = virusType; }

    public String getGameAppearance() { return gameAppearance; }
    public void setGameAppearance(String gameAppearance) { this.gameAppearance = gameAppearance; }

    public Integer getDangerLevel() { return dangerLevel; }
    public void setDangerLevel(Integer dangerLevel) { this.dangerLevel = dangerLevel; }

    public String getWeakness() { return weakness; }
    public void setWeakness(String weakness) { this.weakness = weakness; }
}