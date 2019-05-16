class Cloth {

    constructor(w, h, l) {
        //w = w || 10;
        //h = h || 10;
        this.w = w;
        this.h = h;
        restDistance = l / w; // assuming square cloth for now


        var particles = [];
        var constrains = [];

        var u, v;

        // Create particles
        for (v = 0; v <= h; v++) {
            for (u = 0; u <= w; u++) {
                particles.push(
                    new Particle(u / w, v / h, 0, MASS)
                );
            }
        }



        for (v = 0; v <= h; v++) {
            for (u = 0; u <= w; u++) {

                if (v < h && (u == 0 || u == w)) {
                    constrains.push([
                        particles[this.index(u, v)],
                        particles[this.index(u, v + 1)],
                        restDistance
                    ]);
                }

                if (u < w && (v == 0 || v == h)) {
                    constrains.push([
                        particles[this.index(u, v)],
                        particles[this.index(u + 1, v)],
                        restDistance
                    ]);
                }
            }
        }


        // Structural

        if (structuralSprings) {

            for (v = 0; v < h; v++) {
                for (u = 0; u < w; u++) {

                    if (u != 0) {
                        constrains.push([
                            particles[this.index(u, v)],
                            particles[this.index(u, v + 1)],
                            restDistance
                        ]);
                    }

                    if (v != 0) {
                        constrains.push([
                            particles[this.index(u, v)],
                            particles[this.index(u + 1, v)],
                            restDistance
                        ]);
                    }

                }
            }
        }

        // Shear

        if (shearSprings) {

            for (v = 0; v <= h; v++) {
                for (u = 0; u <= w; u++) {

                    if (v < h && u < w) {
                        constrains.push([
                            particles[this.index(u, v)],
                            particles[this.index(u + 1, v + 1)],
                            restDistanceS * restDistance
                        ]);

                        constrains.push([
                            particles[this.index(u + 1, v)],
                            particles[this.index(u, v + 1)],
                            restDistanceS * restDistance
                        ]);
                    }

                }
            }
        }



        // Bending springs

        if (bendingSprings) {

            for (v = 0; v < h; v++) {

                for (u = 0; u < w; u++) {

                    if (v < h - 1) {
                        constrains.push([
                            particles[this.index(u, v)],
                            particles[this.index(u, v + 2)],
                            restDistanceB * restDistance
                        ]);
                    }

                    if (u < w - 1) {
                        constrains.push([
                            particles[this.index(u, v)],
                            particles[this.index(u + 2, v)],
                            restDistanceB * restDistance
                        ]);
                    }


                }
            }
        }




        this.particles = particles;
        this.constrains = constrains;

    }

    index(u, v) {

        return u + v * (this.w + 1);

    }

    satisifyConstrains(p1, p2, distance) {

        diff.subVectors(p2.position, p1.position);
        var currentDist = diff.length();
        if (currentDist == 0) return; // prevents division by 0
        var correction = diff.multiplyScalar((currentDist - distance) / currentDist);
        var correctionHalf = correction.multiplyScalar(0.5);
        p1.position.add(correctionHalf);
        p2.position.sub(correctionHalf);

    }

    repelParticles(p1, p2, distance) {

        diff.subVectors(p2.position, p1.position);
        var currentDist = diff.length();
        if (currentDist == 0) return; // prevents division by 0
        if (currentDist < distance) {
            var correction = diff.multiplyScalar((currentDist - distance) / currentDist);
            var correctionHalf = correction.multiplyScalar(0.5);
            p1.position.add(correctionHalf);
            p2.position.sub(correctionHalf);
        }

    }
}
