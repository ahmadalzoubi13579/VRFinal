class Particle {

    constructor(x, y, z, mass) {
        this.position = new THREE.Vector3()
        clothInitialPosition(x, y, this.position)
        this.previous = new THREE.Vector3()
        clothInitialPosition(x, y, this.previous)
        this.original = new THREE.Vector3()
        clothInitialPosition(x, y, this.original)
        this.a = new THREE.Vector3(0, 0, 0); // acceleration
        this.mass = mass;
        this.invMass = 1 / mass;
        this.tmp = new THREE.Vector3();
        this.tmp2 = new THREE.Vector3();
    }

    lockToOriginal() {

        this.position.copy(this.original);
        this.previous.copy(this.original);
    }

    lock() {

        this.position.copy(this.previous);
        this.previous.copy(this.previous);

    }


    // Force -> Acceleration
    addForce(force) {

        this.a.add(
            this.tmp2.copy(force).multiplyScalar(this.invMass)
        );

    };

    

    // Performs verlet integration
    integrate(timesq) {

        let newPos = this.tmp.subVectors(this.position, this.previous);
        newPos.multiplyScalar(DRAG).add(this.position);
        newPos.add(this.a.multiplyScalar(timesq));

        this.tmp = this.previous;
        this.previous = this.position;
        this.position = newPos;

        this.a.set(0, 0, 0);

    };

}