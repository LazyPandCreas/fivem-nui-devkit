-- Fake data for testing without having to create a real account/player every time.
-- Executed automatically by Docker at first container startup.

CREATE TABLE IF NOT EXISTS players (
    id INT PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    money INT NOT NULL DEFAULT 0,
    job VARCHAR(32) NOT NULL DEFAULT 'unemployed'
);

INSERT INTO players (id, name, money, job) VALUES
    (1, 'John Smith (test)', 4200, 'police')
ON DUPLICATE KEY UPDATE name = VALUES(name);
